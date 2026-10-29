const assert = require('node:assert/strict');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';

(async () => {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch({ headless: true });
    try {
      for (const mobile of [false, true]) {
        const page = await browser.newPage({
          viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
          isMobile: mobile, hasTouch: mobile,
        });
        page.setDefaultTimeout(15000);
        await page.route('**/api/**', route => route.abort());
        const activate = locator => mobile ? locator.tap() : locator.click();
        await page.goto(`${base}/register`);
        await activate(page.getByRole('button', { name: 'เริ่มลงทะเบียน', exact: true }));
        for (const label of await page.locator('.consent-row label').all()) await activate(label);
        await activate(page.getByRole('button', { name: 'ยืนยันและเริ่มกรอกข้อมูล' }));
        for (const [label, values] of [
          ['คำนำหน้า', ['นาย', 'นางสาว', 'นาง', 'ไม่ระบุ']],
          ['เพศ', ['ชาย', 'หญิง', 'อื่นๆ', 'ไม่ระบุ']],
          ['สถานภาพสมรส', ['สมรส', 'โสด']],
        ]) {
          const field = page.getByRole('combobox', { name: new RegExp(label) });
          for (const value of values) {
            await activate(field);
            await activate(page.getByRole('option', { name: value, exact: true }));
            assert.equal((await field.innerText()).trim(), value);
            assert.equal(await field.getAttribute('aria-expanded'), 'false');
          }
        }
        const title = page.getByRole('combobox', { name: /คำนำหน้า/ });
        await title.focus();
        await title.press('ArrowDown');
        const current = page.getByRole('option', { name: 'ไม่ระบุ', exact: true });
        await current.focus();
        await current.press('Home');
        await page.getByRole('option', { name: 'นาย', exact: true }).press('Enter');
        assert.equal((await title.innerText()).trim(), 'นาย');
        await activate(title);
        await page.getByRole('option', { name: 'นาย', exact: true }).press('Escape');
        assert.equal(await title.getAttribute('aria-expanded'), 'false');
        await activate(title);
        await activate(page.getByRole('heading', { name: 'ข้อมูลส่วนตัว', exact: true }).first());
        assert.equal(await title.getAttribute('aria-expanded'), 'false');
        await title.scrollIntoViewIfNeeded();
        await page.screenshot({ path: `/tmp/telemed-registration-select-${engine.name()}-${mobile ? 'mobile' : 'desktop'}.png` });
        console.log(`PASS ${engine.name()} ${mobile ? 'touch' : 'mouse'}: selects, keyboard, outside dismissal`);
        await page.close();
      }
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
