const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { readFileSync } = require('node:fs');
const { parseEnv } = require('node:util');
const { createHmac } = require('node:crypto');
const assert = require('node:assert/strict');
const env = parseEnv(readFileSync('.env.local', 'utf8'));
const secret = env.TELEMED_SESSION_SECRET || env.TELEMED_DEMO_BRIDGE_SECRET;
const payload = Buffer.from(JSON.stringify({ kind: 'session', expiresAt: Date.now() + 600000, nonce: 'history-test',
  customer: { customerId: 'TL-HISTORY-TEST', name: 'History Test', phone: '0812345678' } })).toString('base64url');
const token = `${payload}.${createHmac('sha256', secret).update(`telemed-dev-v1:${payload}`).digest('base64url')}`;
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.context().addCookies([{ name: 'telemed_demo_session', value: token, url: 'http://localhost:3100', httpOnly: true }]);
      await page.route('**/api/telemed/bookings*', route => route.fulfill({ json: [] }));
      await page.route('**/api/telemed/history', route => route.fulfill({ json: {
        bookings: [{ id: 'booking', date: '2026-09-24', time: '10:00', doctorName: 'แพทย์ทดสอบ', courseName: 'ค่าปรึกษา', price: 500, paidAmount: 500, state: 'CONFIRMED', saleOrderId: 'SO-CONSULT' }],
        medicines: [{ saleOrderId: 'SO-MED', date: '2026-09-24T05:00:00Z', names: ['รายการยาทดสอบ'], total: 3300, paidAmount: 3300, balance: 0, status: 'PAID', paymentUrl: null, receipts: [{ id: 'RC-1', date: '2026-09-24T05:00:00Z', amount: 3300 }] },
          { saleOrderId: 'SO-PENDING', date: '2026-09-24T05:00:00Z', names: ['รายการรอตรวจ'], total: 3300, paidAmount: 0, balance: 3300, status: 'PENDING_REVIEW', paymentUrl: '/payment/test', receipts: [] }],
      } }));
      await page.goto('http://localhost:3100/register');
      await page.getByRole('button', { name: 'ประวัติ', exact: true }).click();
      await page.getByText('ค่ายา · SO-MED', { exact: true }).waitFor();
      await page.getByText('รอตรวจสอบสลิป', { exact: true }).waitFor();
      assert.match(await page.locator('.history-summary-grid').innerText(), /3,800/);
      assert.match(await page.locator('.history-summary-grid').innerText(), /1 ครั้ง/);
      assert.equal(await page.getByRole('link', { name: 'ดูรายการชำระเงิน' }).count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `/tmp/telemed-history-${width}.png`, fullPage: true });
      console.log(width, 'history totals, pending slip and payment link passed');
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
