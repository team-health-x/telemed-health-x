// Local login only; all subsequent Telemed APIs are mocked. No Beam/SMS calls.
const { chromium } = require('/tmp/healthx-beam-browser/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: '/Users/samabatyamsopa/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  try {
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const login = await page.request.post('http://localhost:3100/api/telemed/auth/local-login', {
        headers: { Origin: 'http://localhost:3100' }, data: { phone: '0652728472' },
      });
      assert.equal(login.status(), 200);
      const session = await login.json();
      let resumes = 0;
      let reads = 0, capabilities = 0, expired = false;
      const canceled = [];
      page.on('requestfailed', request => { if (request.url().includes('/api/telemed/beam/')) canceled.push(request.url()); });
      const qr = await require('/tmp/healthx-beam-browser/node_modules/qrcode').toDataURL('TEST ONLY - NOT A PAYMENT');
      const payment = () => ({ id: 'payment', bookingId: 'booking', amount: 500, status: expired ? 'EXPIRED' : 'PENDING',
        qrImage: resumes ? qr : null, sandbox: true, expiresAt: new Date(Date.now() + (expired ? -1000 : 900000)).toISOString() });
      await page.route('**/api/telemed/**', async route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith('/auth/session')) return route.fulfill({ json: session });
        if (path === '/api/telemed/bookings') return route.fulfill({ json: [
          { id: 'booking', beamPayment: true, state: 'PENDING_PAYMENT', doctorName: 'แพทย์ทดสอบ', courseName: 'ปรึกษาแพทย์', date: '2026-10-22', time: '09:00', price: 500, saleOrderId: 'SO-test' },
          { id: 'slip', beamPayment: false, state: 'PENDING_PAYMENT', doctorName: 'แพทย์ทดสอบ', courseName: 'โอนและแนบสลิป', date: '2026-10-23', time: '09:00', price: 500, saleOrderId: 'SO-slip' },
        ] });
        if (path.endsWith('/beam/capabilities')) {
          capabilities++; await new Promise(resolve => setTimeout(resolve, 200));
          return route.fulfill({ json: { available: true, sandbox: true } });
        }
        if (path.endsWith('/beam/bookings/booking/resume')) {
          assert.equal(route.request().method(), 'POST'); resumes++;
          return route.fulfill({ json: payment() });
        }
        if (path.endsWith('/beam/bookings/booking')) {
          reads++; await new Promise(resolve => setTimeout(resolve, 200));
          return route.fulfill({ json: payment() });
        }
        if (path.includes('/beam/')) assert.notEqual(route.request().method(), 'POST', 'No other payment mutations');
        return route.fulfill({ json: [] });
      });
      await page.goto('http://localhost:3100/register?tab=appointments');
      const card = page.locator('.booking-process-card').filter({ hasText: 'SO-test' });
      await card.getByText('รอชำระเงิน', { exact: true }).waitFor();
      assert.equal(await card.getByText('รอตรวจสอบการชำระเงิน', { exact: true }).count(), 0);
      await page.locator('.booking-process-card').filter({ hasText: 'SO-slip' }).getByText('รอตรวจสอบการชำระเงิน', { exact: true }).waitFor();
      await card.getByRole('button', { name: 'ชำระเงิน', exact: true }).click();
      const create = card.getByRole('button', { name: 'สร้าง QR เพื่อชำระเงิน', exact: true });
      await create.waitFor();
      assert.equal(reads, 1, 'Strict Mode must share the initial booking GET');
      assert.equal(capabilities, 1, 'Strict Mode must share the capabilities GET');
      assert.deepEqual(canceled, [], 'Effect cleanup must not cancel GETs');
      assert.equal(resumes, 0, 'Opening must not create a charge');
      await create.click();
      await card.locator('.beam-qr').waitFor();
      assert.equal(resumes, 1);
      assert.equal(await card.locator('.beam-qr').evaluate(el => el.complete && el.naturalWidth > 0), true);
      assert.equal(await card.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
      await page.screenshot({ path: `/tmp/telemed-resume-${width}.png`, fullPage: true });
      expired = true;
      await card.getByRole('button', { name: 'ตรวจสอบผลชำระ', exact: true }).click();
      await card.getByText('รายการชำระหมดอายุ กรุณาตรวจสอบผลชำระก่อนเลือกนัดหมายใหม่', { exact: true }).waitFor();
      assert.equal(await card.locator('.beam-qr').count(), 0);
      assert.equal(resumes, 1, 'Expiry must not create a new charge automatically');
      assert.deepEqual(canceled, []);
      await page.close();
    }
    console.log('PASS: unpaid vs slip-review labels, explicit resume, responsive QR; no provider calls.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
