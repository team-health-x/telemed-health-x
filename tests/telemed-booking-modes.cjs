// All APIs are intercepted. No bookings, receipts or notifications are created.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/tmp/healthx-login-check/node_modules/playwright');
const assert = require('node:assert/strict');
const base = 'http://localhost:3100';
const day = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const first = day(3), second = day(4), past = day(-1);
const offering = (id, availability) => ({ id, name: `แพทย์ ${id}`, courses: [{ courseItemId: `course-${id}`, courseName: `ปรึกษา ${id}`, price: id === 'A' ? 500 : 700, durationMinutes: 30, availability }] });
const catalog = { doctors: [offering('A', [{ date: first, times: ['09:00', '10:00'] }, { date: past, times: ['09:00'] }]), offering('B', [{ date: second, times: ['13:00'] }])] };
(async () => {
  const browser = await chromium.launch({ executablePath: '/Users/samabatyamsopa/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  try {
    for (const width of [390, 320, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const submissions = [], errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api/telemed/**', route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith('/catalog')) return route.fulfill({ json: catalog });
        if (path.endsWith('/payment-methods')) return route.fulfill({ json: [{ id: 'test', name: 'ทดสอบ ห้ามโอนเงินจริง' }] });
        if (path.endsWith('/bookings') && route.request().method() === 'POST') {
          submissions.push(route.request().postDataJSON());
          return route.fulfill({ status: 409, json: { error: 'ทดสอบคิวถูกจอง กรุณาเลือกใหม่' } });
        }
        return route.fulfill({ json: [] });
      });
      await page.goto(`${base}/register/appointments`);
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('radio').first().waitFor();
      assert.equal(await dialog.getByRole('radio').count(), 2);
      await dialog.getByRole('button', { name: 'เลือกวันและเวลา', exact: true }).click();
      assert.equal(await dialog.locator('.date-options button').count(), 1);
      await dialog.locator('.date-options button').click();
      assert.equal(await dialog.locator('.time-options button').count(), 2);
      await dialog.getByRole('button', { name: '10:00', exact: true }).click();
      assert.equal(await dialog.getByRole('button', { name: /ไปหน้าชำระเงิน/ }).isEnabled(), true);
      await dialog.getByRole('button', { name: 'เลือกวันก่อน', exact: true }).click();
      assert.equal(await dialog.locator('.date-options button').count(), 2);
      assert.equal(await dialog.getByRole('button', { name: 'เลือกแพทย์ที่ว่าง', exact: true }).isDisabled(), true);
      await dialog.locator('.date-options button').nth(1).click();
      await page.screenshot({ path: `/tmp/booking-date-first-${width}.png` });
      await dialog.getByRole('button', { name: 'เลือกแพทย์ที่ว่าง', exact: true }).click();
      assert.equal(await dialog.getByRole('radio').count(), 1);
      await dialog.getByRole('radio').filter({ hasText: 'แพทย์ B' }).waitFor();
      await dialog.getByRole('button', { name: 'เลือกเวลา', exact: true }).click();
      assert.equal(await dialog.locator('.time-options button').count(), 1);
      assert.equal(await dialog.getByRole('button', { name: /ไปหน้าชำระเงิน/ }).isDisabled(), true);
      await dialog.getByRole('button', { name: '13:00', exact: true }).click();
      assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
      await page.screenshot({ path: `/tmp/booking-available-times-${width}.png` });
      await dialog.getByRole('button', { name: /ไปหน้าชำระเงิน/ }).click();
      await dialog.locator('.payment-total').getByText('฿700', { exact: true }).waitFor();
      await dialog.getByRole('button', { name: 'ไปแนบสลิปทดสอบ' }).click();
      await dialog.locator('input[type=file]').setInputFiles({ name: 'test.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') });
      await dialog.getByRole('button', { name: 'ส่งนัดหมายและสลิป', exact: true }).click();
      await dialog.getByRole('alert').filter({ hasText: 'ทดสอบคิวถูกจอง' }).waitFor();
      assert.equal(submissions[0].doctorId, 'B'); assert.equal(submissions[0].date, second); assert.equal(submissions[0].time, '13:00');
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS: both booking paths, date-doctor filtering, notice filtering, selection reset, correct payload, conflict display, responsive layouts. No real writes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
