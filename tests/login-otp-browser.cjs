const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      let sends = 0;
      await page.route('**/api/telemed/auth/*', route => {
        const action = new URL(route.request().url()).pathname.split('/').pop();
        if (action === 'send-otp') {
          sends++;
          return route.fulfill({ json: { challengeId: 'test-login', resendAt: Date.now() + 60000, expiresAt: Date.now() + 300000 } });
        }
        if (action === 'verify-otp') {
          assert.equal(route.request().postDataJSON().challengeId, 'test-login');
          return route.fulfill({ status: 403, json: { error: 'OTP ไม่ถูกต้อง' } });
        }
        return route.abort();
      });
      await page.goto('http://localhost:3100/login');
      assert.equal(await page.getByText(/OTP ทดสอบ/).count(), 0);
      await page.getByLabel('เบอร์โทรศัพท์').fill('0812345678');
      await page.screenshot({ path: `/tmp/telemed-login-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: 'ขอรหัส OTP', exact: true }).click();
      await page.getByLabel('รหัส OTP 6 หลัก').fill('000000');
      const digits = page.locator('.login-otp-digits input');
      assert.equal(await digits.count(), 6);
      assert.deepEqual(await digits.evaluateAll(inputs => inputs.map(input => input.value)), ['0', '0', '0', '0', '0', '0']);
      await digits.nth(5).press('Backspace');
      await digits.nth(5).press('Backspace');
      assert.equal(await digits.nth(4).inputValue(), '');
      assert.ok(await page.getByRole('button', { name: 'ยืนยันและเข้าสู่ระบบ' }).isDisabled());
      await digits.nth(0).evaluate(input => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text', '654321');
        input.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true }));
      });
      assert.deepEqual(await digits.evaluateAll(inputs => inputs.map(input => input.value)), ['6', '5', '4', '3', '2', '1']);
      assert.ok(await page.getByRole('button', { name: /ขอรหัสใหม่ใน/ }).isDisabled());
      await page.getByRole('button', { name: 'ยืนยันและเข้าสู่ระบบ' }).click();
      await page.getByRole('alert').waitFor();
      await page.screenshot({ path: `/tmp/telemed-login-otp-${width}.png`, fullPage: true });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(sends, 1);
      await page.getByRole('button', { name: 'เปลี่ยนเบอร์โทรศัพท์' }).click();
      assert.equal(await page.getByLabel('รหัส OTP 6 หลัก').count(), 0);
      await page.close();
    }
    console.log('PASS login mobile/desktop, SMS request, cooldown, invalid OTP, change phone; all SMS mocked');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
