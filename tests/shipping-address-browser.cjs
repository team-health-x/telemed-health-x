const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { readFileSync } = require('node:fs');
const { parseEnv } = require('node:util');
const { createHmac } = require('node:crypto');
const assert = require('node:assert/strict');
const env = parseEnv(readFileSync('.env.local', 'utf8'));
const secret = env.TELEMED_SESSION_SECRET || env.TELEMED_DEMO_BRIDGE_SECRET;
const payload = Buffer.from(JSON.stringify({ kind: 'session', expiresAt: Date.now() + 600000, nonce: 'address-test',
  customer: { customerId: 'TL-ADDRESS-TEST', name: 'Address Test', phone: '0812345678' } })).toString('base64url');
const token = `${payload}.${createHmac('sha256', secret).update(`telemed-dev-v1:${payload}`).digest('base64url')}`;
const area = (id, province, district, zip) => ({ id, province_id: province, province_TH: `จังหวัด${province}`, district_id: district, district_TH: `อำเภอ${district}`, sub_district_id: id, sub_district_TH: `ตำบล${id}`, postcode: zip });
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.context().addCookies([{ name: 'telemed_demo_session', value: token, url: 'http://localhost:3100', httpOnly: true }]);
      await page.route('**/api/telemed/bookings*', r => r.fulfill({ json: [] }));
      await page.route('**/data/thai-addresses.json', r => r.fulfill({ json: [area('a', 'A', 'A1', '11111'), area('b', 'A', 'A2', '11111'), area('c', 'B', 'B1', '22222')] }));
      await page.goto('http://localhost:3100/register');
      await page.getByRole('button', { name: 'โปรไฟล์', exact: true }).click();
      await page.getByRole('button', { name: /ที่อยู่จัดส่ง/ }).click();
      const dialog = page.getByRole('dialog');
      const save = dialog.getByRole('button', { name: 'บันทึกข้อมูล' });
      await dialog.getByLabel('บ้านเลขที่ อาคาร หมู่ ซอย ถนน').fill('99/9');
      await dialog.getByLabel('รหัสไปรษณีย์', { exact: true }).fill('11111');
      assert.equal(await dialog.getByLabel('จังหวัด', { exact: true }).inputValue(), 'A');
      assert.equal(await save.isDisabled(), true);
      await dialog.getByLabel('พื้นที่ของรหัสไปรษณีย์', { exact: true }).selectOption('b');
      assert.equal(await dialog.getByLabel('อำเภอ/เขต', { exact: true }).inputValue(), 'A2');
      assert.equal(await save.isEnabled(), true);
      await dialog.getByLabel('จังหวัด', { exact: true }).selectOption('B');
      assert.equal(await dialog.getByLabel('อำเภอ/เขต', { exact: true }).inputValue(), '');
      assert.equal(await save.isDisabled(), true);
      assert.equal(await dialog.getByLabel('อำเภอ/เขต', { exact: true }).locator('option[value="A1"]').count(), 0);
      await dialog.getByLabel('อำเภอ/เขต', { exact: true }).selectOption('B1');
      await dialog.getByLabel('ตำบล/แขวง', { exact: true }).selectOption('c');
      assert.equal(await dialog.getByLabel('รหัสไปรษณีย์', { exact: true }).inputValue(), '22222');
      await dialog.getByLabel('รหัสไปรษณีย์', { exact: true }).fill('99999');
      assert.equal(await save.isDisabled(), true);
      await dialog.getByLabel('รหัสไปรษณีย์', { exact: true }).fill('22222');
      assert.equal(await dialog.getByLabel('ตำบล/แขวง', { exact: true }).inputValue(), 'c');
      await page.screenshot({ path: `/tmp/shipping-address-${width}.png`, fullPage: true });
      await save.click();
      await page.getByRole('button', { name: /ที่อยู่จัดส่ง/ }).click();
      await dialog.getByLabel('ตำบล/แขวง', { exact: true }).locator('option[value="c"]').waitFor({ state: 'attached' });
      assert.equal(await dialog.getByLabel('ตำบล/แขวง', { exact: true }).inputValue(), 'c');
      assert.deepEqual(errors, []);
      console.log(width, 'postal lookup, ambiguity, cascade, invalid postcode and reopen passed');
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
