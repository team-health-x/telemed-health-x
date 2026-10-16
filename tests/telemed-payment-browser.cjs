// All payment API calls use fixtures. Never transfers money or writes to the database.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { readFileSync } = require('node:fs');
const { parseEnv } = require('node:util');
const { createHmac } = require('node:crypto');
const assert = require('node:assert/strict');
const env = parseEnv(readFileSync('.env.local', 'utf8'));
const secret = process.env.TELEMED_SESSION_SECRET || env.TELEMED_SESSION_SECRET || env.TELEMED_DEMO_BRIDGE_SECRET;
const origin = process.env.TELEMED_TEST_ORIGIN || 'http://localhost:3100';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
const ticket = Buffer.from(JSON.stringify({ kind: 'session', expiresAt: Date.now() + 600000, nonce: 'payment-ui-test',
  customer: { customerId: 'TL-TEST', name: 'Payment UI Test', phone: '0812345678' } })).toString('base64url');
const token = `${ticket}.${createHmac('sha256', secret).update(`telemed-dev-v1:${ticket}`).digest('base64url')}`;
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${origin}/payment/payment-test`); await page.waitForURL('**/login?next=*');
    await page.context().addCookies([{ name: 'telemed_demo_session', value: token, url: origin, httpOnly: true }]);
    const detail = { id: 'payment-test', saleOrderId: 'SO-TEST-001', total: 1500, paid: 500, balance: 1000, version: 'version-1', status: 'UNPAID', devOnly: true,
      items: [{ id: '1', name: 'รายการยาตามใบขายทดสอบ', quantity: 1, price: 1700, net: 1700 }, { id: '2', name: 'รายการเพิ่มเติม', quantity: 2, price: 150, net: 300 }],
      consultationDiscount: { amount: 500, originalTotal: 2000, sourceSaleId: 'SO-CONSULT-001' },
      bank: { name: 'ธนาคารทดสอบ', accountName: 'บัญชีทดสอบ ห้ามโอนเงิน', accountNumber: 'TEST-ACCOUNT' }, slip: null };
    let fail = true; const requests = [];
    await page.route('**/api/telemed/**', async route => {
      if (!route.request().url().includes('/payments/')) return route.fulfill({ contentType: 'application/json', body: '{}' });
      if (route.request().method() === 'POST') {
        requests.push(route.request().postDataJSON());
        if (fail) { fail = false; return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'ทดสอบเครือข่ายขัดข้อง' }) }); }
        detail.status = 'PENDING_REVIEW'; detail.slip = { id: 'slip', file_name: 'slip.pdf', created_at: new Date().toISOString() };
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'slip', status: 'PENDING_REVIEW' }) });
      }
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(detail) });
    });
    await page.goto(`${origin}/payment/payment-test`);
    await page.getByRole('heading', { name: 'สรุปรายการ' }).waitFor();
    assert.ok(await page.locator('.payment-balance').innerText().then(s => s.includes('1,000.00')));
    const totals = await page.locator('.payment-totals').innerText();
    assert.ok(totals.includes('2,000.00') && totals.includes('-500.00'));
    assert.ok(totals.includes('SO-CONSULT-001'));
    await page.getByRole('button', { name: 'ใช้สลิปทดสอบ (Local)' }).click();
    await page.locator('.payment-file').filter({ hasText: 'TEST-ONLY-local-slip.png' }).waitFor();
    await page.getByAltText('ตัวอย่างสลิป').waitFor();
    assert.equal(requests.length, 0, 'Autofill must not submit a slip');
    await page.getByRole('button', { name: 'ลบไฟล์', exact: true }).click();
    assert.equal(await page.locator('.payment-file').count(), 0);
    await page.locator('input[type=file]').setInputFiles({ name: 'bad.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('bad') });
    await page.getByRole('alert').filter({ hasText: 'ไม่เกิน 3 MB' }).waitFor();
    await page.locator('input[type=file]').setInputFiles({ name: 'slip.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n') });
    await page.screenshot({ path: '/tmp/telemed-payment-desktop.png', fullPage: true });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No horizontal overflow');
    }
    await page.screenshot({ path: '/tmp/telemed-payment-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'ส่งสลิปให้ตรวจสอบ' }).click();
    await page.getByRole('alert').filter({ hasText: 'เครือข่าย' }).waitFor();
    await page.getByRole('button', { name: 'ส่งสลิปให้ตรวจสอบ' }).click();
    await page.locator('.payment-state').filter({ hasText: 'รอตรวจสอบสลิป' }).waitFor();
    assert.equal(requests[0].requestKey, requests[1].requestKey);
    assert.equal(requests[1].version, 'version-1'); assert.ok(requests[1].file.data);
    assert.equal(detail.paid, 500, 'Slip upload must not count as payment');
    detail.status = 'PAID'; detail.paid = 1500; detail.balance = 0;
    await page.evaluate(() => dispatchEvent(new Event('focus')));
    await page.locator('.payment-state').filter({ hasText: 'ชำระครบแล้ว' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'ส่งสลิปให้ตรวจสอบ' }).count(), 0);
    detail.status = 'CANCELLED'; await page.reload();
    await page.locator('.payment-state').filter({ hasText: 'ยกเลิกใบขาย' }).waitFor();
    assert.equal(await page.locator('input[type=file]').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS: authentication redirect, invoice totals, file validation, retry, pending/paid/cancelled states, desktop/mobile layout. No real payment writes.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
