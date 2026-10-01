// Intercept prescription requests: no clinical records or payments are written.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { readFileSync } = require('node:fs');
const { parseEnv } = require('node:util');
const { createHmac } = require('node:crypto');
const assert = require('node:assert/strict');
const env = parseEnv(readFileSync('.env.local', 'utf8'));
const secret = env.TELEMED_SESSION_SECRET || env.TELEMED_DEMO_BRIDGE_SECRET;
const origin = 'http://localhost:3100';
const payload = Buffer.from(JSON.stringify({ kind: 'session', expiresAt: Date.now() + 600000, nonce: 'rx-test',
  customer: { customerId: 'TL-RX-TEST', name: 'Prescription Test', phone: '0812345678' } })).toString('base64url');
const token = `${payload}.${createHmac('sha256', secret).update(`telemed-dev-v1:${payload}`).digest('base64url')}`;
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.context().addCookies([{ name: 'telemed_demo_session', value: token, url: origin, httpOnly: true }]);
      await page.route('**/api/telemed/bookings*', route => route.fulfill({ json: [] }));
      let mode = 'rows';
      await page.route('**/api/telemed/prescriptions', route => route.fulfill({ status: mode === 'error' ? 503 : 200,
        json: mode === 'error' ? { error: 'โหลดใบสั่งยาไม่สำเร็จ' } : mode === 'empty' ? [] : [{ id: 'f4513828-ed27-49ee-ae22-7e20506599ea', issuedAt: '2026-09-24T02:00:00Z', opdId: 'OPD-TEST', doctorName: 'แพทย์ทดสอบ',
          items: [{ id: 'item', name: 'รายการยาทดสอบ', quantity: 1, unit: 'ชิ้น', instructions: 'วิธีใช้ที่แพทย์บันทึก' }],
          payment: { status: 'PENDING', balance: 3300, url: '/payment/test' } }] }));
      await page.goto(origin + '/register');
      await page.getByRole('button', { name: 'ใบสั่งยา', exact: true }).click();
      await page.getByText('RX-25690924-F4513828', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'รายละเอียดและวิธีใช้' }).click();
      await page.getByText('วิธีใช้ที่แพทย์บันทึก', { exact: true }).waitFor();
      assert.equal(await page.getByRole('link', { name: 'ดูรายการชำระเงิน' }).getAttribute('href'), '/payment/test');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
      await page.screenshot({ path: `/tmp/telemed-prescriptions-${width}.png`, fullPage: true });
      mode = 'empty'; await page.getByRole('button', { name: 'โหลดใบสั่งยาใหม่' }).click();
      await page.getByText('ยังไม่มีใบสั่งยา', { exact: true }).waitFor();
      mode = 'error'; await page.getByRole('button', { name: 'โหลดใบสั่งยาใหม่' }).click();
      await page.getByRole('alert').waitFor();
      mode = 'rows'; await page.getByRole('button', { name: 'ลองใหม่', exact: true }).click();
      await page.getByText('RX-25690924-F4513828', { exact: true }).waitFor();
      assert.deepEqual(errors, []);
      console.log(`${width}: records, details, payment, empty, error and retry passed`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
