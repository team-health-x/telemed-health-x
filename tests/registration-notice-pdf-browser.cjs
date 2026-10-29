const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';

(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      page.setDefaultTimeout(15000);
      await page.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'เริ่มลงทะเบียน', exact: true }).click();
      const rows = page.locator('.consent-row');
      for (const index of [0, 2]) {
        await rows.nth(index).getByRole('button').click();
        const dialog = page.getByRole('dialog');
        const pages = dialog.locator('.legal-pdf-pages img');
        assert.equal(await pages.count(), 2);
        for (const image of await pages.all()) {
          await image.evaluate(img => img.decode());
          assert.ok(await image.evaluate(img => img.naturalWidth > 1000));
        }
        assert.equal(await dialog.getByText(/หน้าต้นแบบ/).count(), 0);
        assert.equal(await dialog.locator('.legal-pdf-link').getAttribute('target'), '_blank');
        const response = await page.request.get(`${base}/documents/pdpa-rz-2025-026.pdf`);
        assert.equal(response.status(), 200);
        assert.ok((await response.body()).equals(fs.readFileSync(path.join(__dirname, '../public/documents/pdpa-rz-2025-026.pdf'))));
        await page.screenshot({ path: `/tmp/telemed-notice-pdf-${width}-${index + 1}.png` });
        await dialog.getByRole('button', { name: 'ปิดเอกสาร', exact: true }).click();
        assert.equal(await rows.nth(index).getByRole('checkbox').isChecked(), false);
      }
      await rows.nth(1).getByRole('button').click();
      assert.equal(await page.getByRole('dialog').locator('.legal-pdf-pages').count(), 0);
      const personalConsent = page.getByRole('dialog');
      await personalConsent.getByText('ข้าพเจ้ายินยอมให้บริษัท เดอะริทซ์เอสเธทิค จำกัด เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล รวมถึงข้อมูลสุขภาพของข้าพเจ้า เท่าที่จำเป็นสำหรับการลงทะเบียน ยืนยันตัวตน การนัดหมาย การให้คำปรึกษาและการรักษาผ่านระบบการแพทย์ทางไกล การจัดทำเวชระเบียน การจ่ายและจัดส่งยา รวมถึงการติดตามผลการรักษา', { exact: true }).waitFor();
      await personalConsent.getByText('บริษัทจะเก็บรักษาข้อมูลอย่างเหมาะสมและใช้เฉพาะเพื่อวัตถุประสงค์ในการให้บริการและตามที่กฎหมายกำหนด โดยข้าพเจ้ารับทราบสิทธิของตนเกี่ยวกับข้อมูลส่วนบุคคลตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล', { exact: true }).waitFor();
      assert.equal(await personalConsent.getByText(/หน้าต้นแบบ/).count(), 0);
      await page.screenshot({ path: `/tmp/telemed-notice-personal-consent-${width}.png` });
      await personalConsent.getByRole('button', { name: 'รับทราบและปิด', exact: true }).click();
      assert.equal(await rows.nth(1).getByRole('checkbox').isChecked(), false);
      console.log(`PASS ${width}px: items 1/3 use original PDF, item 2 uses supplied text, no automatic consent`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
