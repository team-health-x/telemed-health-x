const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.route('**/api/**', route => route.abort());
      await page.goto('http://127.0.0.1:3100/register');
      await page.getByRole('button', { name: 'เริ่มลงทะเบียน', exact: true }).click();
      const noticeRows = page.locator('.consent-row');
      const noticeLabels = await noticeRows.locator('label').allTextContents();
      await noticeRows.nth(0).getByRole('button').click();
      const pdf = await page.getByRole('dialog').locator('.legal-pdf-link').getAttribute('href');
      await page.getByRole('button', { name: 'ปิดเอกสาร', exact: true }).click();
      await noticeRows.nth(1).getByRole('button').click();
      const consentText = await page.getByRole('dialog').locator(':scope > p').allTextContents();
      await page.getByRole('button', { name: 'ปิดเอกสาร', exact: true }).click();
      for (const label of await noticeRows.locator('label').all()) await label.click();
      await page.getByRole('button', { name: 'ยืนยันและเริ่มกรอกข้อมูล' }).click();
      await page.getByRole('button', { name: 'สุ่มข้อมูลทดสอบ + ยอมรับทั้งหมด + ลายเซ็นทดสอบ' }).click();
      assert.deepEqual((await page.locator('.consent-row label').allTextContents()).slice(1, 4), noticeLabels);
      for (const label of ['รับทราบนโยบายความเป็นส่วนตัว', 'ยินยอมให้เก็บและใช้ข้อมูลสุขภาพและข้อมูลทางการแพทย์']) {
        const row = page.locator('.consent-row').filter({ hasText: label });
        assert.equal(await row.getByRole('checkbox').isChecked(), true);
        await row.getByRole('button').click();
        const dialog = page.getByRole('dialog');
        assert.equal(await dialog.locator('.legal-pdf-link').getAttribute('href'), pdf);
        assert.equal(await dialog.locator('.legal-pdf-pages img').count(), 2);
        assert.equal(await dialog.locator('.legal-note').count(), 0);
        await page.getByRole('button', { name: 'ปิดเอกสาร', exact: true }).click();
      }
      const personal = page.locator('.consent-row').filter({ hasText: 'ยินยอมให้เก็บและใช้ข้อมูลส่วนบุคคล' });
      await personal.getByRole('button').click();
      assert.deepEqual(await page.getByRole('dialog').locator(':scope > p').allTextContents(), consentText);
      await page.getByRole('button', { name: 'ปิดเอกสาร', exact: true }).click();
      const sensitive = page.locator('.consent-row').filter({ hasText: 'ยินยอมให้เก็บและใช้ข้อมูลสุขภาพและข้อมูลทางการแพทย์' });
      await sensitive.locator('label').click();
      assert.equal(await sensitive.getByRole('checkbox').isChecked(), false);
      await sensitive.getByRole('button').click();
      await page.getByRole('button', { name: 'ปิดเอกสาร', exact: true }).click();
      assert.equal(await sensitive.getByRole('checkbox').isChecked(), false);
      await sensitive.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `/tmp/telemed-review-consents-${width}.png` });
      console.log(`PASS ${width}: shared PDF/text and no automatic acceptance on document close`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
