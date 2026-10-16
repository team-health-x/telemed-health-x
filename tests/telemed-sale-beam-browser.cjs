// Local login is read-only. All payment APIs are mocked; no Beam charges or slips are sent.
const { chromium } = require('/tmp/healthx-beam-browser/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const qr = await require('/tmp/healthx-beam-browser/node_modules/qrcode').toDataURL('TEST ONLY - NOT A PAYMENT');
  const browser = await chromium.launch({ executablePath: '/Users/samabatyamsopa/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  try {
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const login = await page.request.post('http://localhost:3100/api/telemed/auth/local-login', {
        headers: { Origin: 'http://localhost:3100' }, data: { phone: '0652728472' },
      });
      assert.equal(login.status(), 200);
      let creates = 0, status = 'PENDING', attempt = false, failCreate = false, slip = false, available = true;
      let checkDelay = 0, failCheck = false;
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const payment = () => attempt ? { id: 'attempt', amount: 0.1, status, sandbox: false,
        qrImage: failCreate ? null : qr, expiresAt: new Date(Date.now() + (status === 'EXPIRED' ? -61000 : 900000)).toISOString() } : null;
      await page.route('**/api/telemed/**', async route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/telemed/beam/sales/test-sale') {
          if (route.request().method() === 'POST') {
            creates++; attempt = true;
            assert.deepEqual(route.request().postDataJSON(), { version: 'v1' });
            return failCreate ? route.fulfill({ status: 503, json: { error: 'ทดสอบ Beam ไม่อนุญาตการเชื่อมต่อ' } }) : route.fulfill({ json: payment() });
          }
          if (checkDelay) await new Promise(resolve => setTimeout(resolve, checkDelay));
          if (failCheck) return route.fulfill({ status: 503, json: { error: 'ทดสอบตรวจสอบไม่สำเร็จ' } });
          return route.fulfill({ json: { available, sandbox: false, payment: payment() } });
        }
        if (url.pathname === '/api/telemed/payments/test-sale') {
          assert.equal(route.request().method(), 'GET', 'No slip submission');
          return route.fulfill({ json: { id: 'test-sale', saleOrderId: 'SO-TEST', total: 0.1,
            paid: status === 'PAID' ? 0.1 : 0, balance: status === 'PAID' ? 0 : 0.1, version: 'v1', devOnly: true,
            status: status === 'PAID' ? 'PAID' : slip ? 'PENDING_REVIEW' : 'UNPAID',
            items: [{ id: 'item', name: '[ทดสอบ] เข็มปากกาฉีดยา 32G x 4 มม.', price: 0.1, net: 0.1, quantity: 1 }],
            bank: { name: 'Kasikornbank', accountNumber: '6022252548', accountName: null, methodName: 'HealthX-Kbank' },
            slip: slip ? { id: 'slip', file_name: 'TEST.png', created_at: new Date().toISOString() } : null } });
        }
        return route.fulfill({ json: [] });
      });
      await page.goto('http://localhost:3100/payment/test-sale');
      const bank = page.getByRole('radio', { name: 'โอนบัญชีและแนบสลิป', exact: true });
      const create = page.getByRole('button', { name: 'สร้าง QR พร้อมเพย์', exact: true });
      await create.waitFor();
      assert.equal(creates, 0);
      assert.equal(await create.isDisabled(), true, 'Live payment requires explicit confirmation');
      await bank.check(); await page.getByRole('heading', { name: 'บัญชีรับชำระ' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'คัดลอกเลขบัญชี' }).count(), 1);
      await page.getByRole('radio', { name: 'พร้อมเพย์ QR', exact: true }).check();
      await page.getByRole('checkbox', { name: 'ยืนยันสร้าง QR สำหรับชำระเงินจริง' }).check();
      await create.click(); await page.locator('.sale-beam-qr').waitFor();
      assert.equal(creates, 1);
      assert.equal(await bank.isDisabled(), true);
      assert.equal(await page.locator('.sale-beam-qr').evaluate(el => el.complete && el.naturalWidth > 0), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
      await page.screenshot({ path: `/tmp/telemed-sale-beam-${width}.png`, fullPage: true });
      checkDelay = 800; failCheck = true;
      await page.getByRole('button', { name: 'ตรวจสอบผลชำระ' }).click();
      const checking = page.getByRole('button', { name: 'กำลังตรวจสอบ...' });
      await checking.waitFor();
      assert.equal(await checking.isDisabled(), true);
      assert.equal(await checking.getAttribute('aria-busy'), 'true');
      assert.equal(await checking.locator('.sale-beam-spinner').count(), 1);
      await page.getByText('ทดสอบตรวจสอบไม่สำเร็จ', { exact: true }).waitFor();
      const check = page.getByRole('button', { name: 'ตรวจสอบผลชำระ' });
      assert.equal(await check.isEnabled(), true, 'Check unlocks after an error');
      failCheck = false;
      status = 'EXPIRED'; await check.click();
      await checking.waitFor();
      assert.equal(await checking.isDisabled(), true);
      await page.getByText('QR หมดอายุ สามารถเลือกโอนบัญชีและแนบสลิปได้', { exact: true }).waitFor();
      assert.equal(await check.isEnabled(), true, 'Check unlocks after success');
      checkDelay = 0;
      assert.equal(await bank.isDisabled(), false);
      assert.equal(creates, 1, 'Expiry must not create another charge');
      status = 'PAID'; await page.getByRole('button', { name: 'ตรวจสอบผลชำระ' }).click();
      await page.locator('.payment-state.paid').waitFor();
      assert.equal(await page.getByRole('radio').count(), 0);
      attempt = false; status = 'PENDING'; slip = true;
      await page.reload(); await page.getByText('ส่งสลิปแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ', { exact: true }).waitFor();
      assert.equal(await create.count(), 0);
      slip = false; available = false;
      await page.reload(); await page.getByRole('heading', { name: 'บัญชีรับชำระ' }).waitFor();
      assert.equal(await bank.isChecked(), true);
      available = true; failCreate = true;
      await page.reload(); await create.waitFor();
      await page.getByRole('checkbox', { name: 'ยืนยันสร้าง QR สำหรับชำระเงินจริง' }).check();
      await create.click(); await page.getByText('ทดสอบ Beam ไม่อนุญาตการเชื่อมต่อ', { exact: true }).waitFor();
      await page.waitForTimeout(300);
      assert.equal(await page.getByText('ทดสอบ Beam ไม่อนุญาตการเชื่อมต่อ', { exact: true }).count(), 1);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS: sale QR, live confirmation, bank switching, expiry, paid, pending-slip, unavailable, and error states at 320/390/1440; mocked payment APIs only.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
