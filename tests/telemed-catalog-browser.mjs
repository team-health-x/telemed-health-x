import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TELEMED_PREVIEW_URL || 'http://127.0.0.1:3100';
const catalog = {
  doctors: [0, 1, 2].map(i => ({
    id: 'doctor-' + i, name: 'แพทย์ทดสอบ ' + (i + 1),
    courses: [{
      courseItemId: 'consultation', courseCode: 'CC-TL-DEMO01',
      courseName: 'ปรึกษาแพทย์ออนไลน์', price: 500 + i * 150, durationMinutes: 30,
      availability: [{ date: '2026-09-11', times: [String(9 + i * 2).padStart(2, '0') + ':00'] }],
    }],
  })),
};
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().includes('/api/') && request.method() !== 'GET' && !request.url().includes('/auth/session')) writes.push(request.url()); });
    await page.route('**/api/telemed/catalog', route => route.fulfill({ json: catalog }));
    const submitted = [];
    await page.route('**/api/telemed/bookings', async route => {
      submitted.push(route.request().postDataJSON());
      await route.fulfill(submitted.length === 1 ? { status: 503, json: { error: 'ทดสอบส่งซ้ำ' } } : { json: { id: 'booking-test' } });
    });
    await page.goto(base + '/register/appointments', { waitUntil: 'domcontentloaded' });
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('radio').first().waitFor();
    assert.equal(await dialog.getByRole('radio').count(), 3);
    await dialog.getByRole('radio').nth(1).click();
    // Selecting a card must not advance or expand the schedule.
    await dialog.getByRole('heading', { name: 'เลือกแพทย์', exact: true }).waitFor();
    assert.equal(await dialog.locator('.date-options').count(), 0);
    assert.equal(await dialog.getByRole('radio').nth(1).getAttribute('aria-checked'), 'true');
    await page.screenshot({ path: '/tmp/telemed-restored-doctors-' + width + '.png' });
    await dialog.getByRole('button', { name: 'เลือกวันและเวลา', exact: true }).click();
    assert.equal(await dialog.locator('select').count(), 0);
    const pay = dialog.getByRole('button', { name: /ไปหน้าชำระเงิน/ });
    assert(await pay.isDisabled());
    await dialog.locator('.date-options button').first().click();
    await dialog.getByRole('button', { name: '11:00', exact: true }).click();
    await page.screenshot({ path: '/tmp/telemed-restored-schedule-' + width + '.png' });
    await dialog.getByRole('button', { name: 'ย้อนกลับ', exact: true }).click();
    await dialog.getByRole('button', { name: 'เลือกวันและเวลา', exact: true }).click();
    assert.equal(await dialog.getByRole('button', { name: '11:00', exact: true }).getAttribute('aria-pressed'), 'true');
    await dialog.getByRole('button', { name: 'ย้อนกลับ', exact: true }).click();
    await dialog.getByRole('radio').nth(2).click();
    await dialog.getByRole('button', { name: 'เลือกวันและเวลา', exact: true }).click();
    assert(await pay.isDisabled());
    assert.equal(await dialog.locator('.time-options button').count(), 0);
    await dialog.locator('.date-options button').first().click();
    await dialog.getByRole('button', { name: '13:00', exact: true }).click();
    await pay.click();
    await dialog.getByRole('heading', { name: 'ชำระค่าปรึกษา', exact: true }).waitFor();
    await dialog.locator('.payment-total').getByText('฿800', { exact: true }).waitFor();
    await dialog.getByRole('button', { name: 'ไปแนบสลิปทดสอบ' }).click();
    const confirm = dialog.getByRole('button', { name: 'ส่งนัดหมายและสลิป', exact: true });
    assert(await confirm.isDisabled());
    await dialog.locator('input[type=file]').setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('test') });
    await dialog.locator('.slip-error').waitFor();
    assert(await confirm.isDisabled());
    await dialog.locator('input[type=file]').setInputFiles({ name: 'demo.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 demo') });
    assert.equal(await dialog.evaluate(el => el.scrollWidth > el.clientWidth), false);
    await confirm.click();
    await dialog.getByText('ทดสอบส่งซ้ำ', { exact: true }).waitFor();
    await page.screenshot({ path: '/tmp/telemed-booking-submit-' + width + '.png' });
    await confirm.click();
    await page.waitForURL(base + '/register?tab=appointments');
    assert.equal(submitted.length, 2);
    assert.equal(submitted[0].requestKey, submitted[1].requestKey);
    assert.equal(submitted[0].doctorId, 'doctor-2');
    assert.equal(submitted[0].expectedPrice, 800);
    assert.deepEqual(errors, []);
    assert.equal(writes.length, 2);
    console.log('PASS 4-step booking, back/reset, price, file validation, idempotent retry and redirect, ' + width + 'px');
    await page.close();
  }
  const page = await browser.newPage();
  await page.route('**/api/telemed/catalog', async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.fulfill({ status: 503, json: { error: 'โหลดไม่สำเร็จ' } });
  });
  await page.goto(base + '/register/appointments', { waitUntil: 'domcontentloaded' });
  await page.getByText('กำลังโหลดแพทย์และคอร์ส...').waitFor();
  await page.getByText('โหลดไม่สำเร็จ', { exact: true }).waitFor();
  await page.unroute('**/api/telemed/catalog');
  await page.route('**/api/telemed/catalog', route => route.fulfill({ json: { doctors: [] } }));
  await page.getByRole('button', { name: 'ลองใหม่', exact: true }).click();
  await page.getByText('ยังไม่มีแพทย์เปิดรับนัดในช่วงนี้').waitFor();
  console.log('PASS loading, error, retry and empty states');
  await page.close();
} finally { await browser.close(); }
