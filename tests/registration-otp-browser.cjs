const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(15000);
    let sends = 0, checks = 0;
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'localhost') return route.abort();
      if (url.pathname === '/api/telemed/signup-otp/send') {
        sends++;
        return route.fulfill({ json: { challengeId: 'test', expiresAt: Date.now() + 300000, resendAt: Date.now() + 60000 } });
      }
      if (url.pathname === '/api/telemed/signup-otp/verify') {
        checks++;
        return route.request().postDataJSON().code === '654321'
          ? route.fulfill({ json: { proof: 'test-proof', expiresAt: Date.now() + 1800000 } })
          : route.fulfill({ status: 403, json: { error: 'OTP ไม่ถูกต้อง' } });
      }
      if (url.pathname === '/api/telemed/register') throw new Error('This test must not create a customer');
      return route.continue();
    });
    await page.goto('http://localhost:3100/register', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'เริ่มลงทะเบียน', exact: true }).click();
    for (const checkbox of await page.getByRole('checkbox').all()) {
      if (!await checkbox.isChecked()) await checkbox.locator('..').click();
    }
    await page.getByRole('button', { name: 'ยืนยันและเริ่มกรอกข้อมูล' }).click();
    await page.getByRole('button', { name: /สุ่มข้อมูลทดสอบ/ }).click();
    await page.getByRole('button', { name: 'ส่งรหัส OTP', exact: true }).click();
    await page.getByLabel('รหัส OTP 6 หลัก').fill('000000');
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await page.getByText('OTP ไม่ถูกต้อง', { exact: true }).waitFor();
    await page.getByLabel('รหัส OTP 6 หลัก').scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/telemed-otp-mobile.png' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByLabel('รหัส OTP 6 หลัก').scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/telemed-otp-desktop.png' });
    await page.getByLabel('รหัส OTP 6 หลัก').fill('654321');
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await page.locator('.otp-verification.verified').waitFor();
    assert.equal(sends, 1);
    assert.equal(checks, 2);
    assert.equal(await page.getByText('รหัสสำหรับทดสอบ: 123456').count(), 0);
    console.log('PASS real-OTP UI with mocked SMS: invalid code, verification, mobile/desktop; no SMS or signup');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
