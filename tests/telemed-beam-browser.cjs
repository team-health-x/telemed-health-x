// All Telemed APIs are mocked. Never creates a Beam charge or a database record.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/tmp/healthx-login-check/node_modules/playwright');
const assert = require('node:assert/strict');
const day = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
(async () => {
  const qr = await require(process.env.QRCODE_MODULE || '/tmp/healthx-beam-browser/node_modules/qrcode').toDataURL('TEST ONLY - NOT A PAYMENT', { width: 240, margin: 4 });
  const browser = await chromium.launch({ executablePath: '/Users/samabatyamsopa/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
  try {
    for (const sandbox of [true, false]) for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      let state = 'PENDING';
      const creates = [], errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const payment = () => ({ id: 'pay', bookingId: 'booking', amount: 500, status: state, sandbox,
        qrImage: qr, expiresAt: new Date(Date.now() + 900000).toISOString() });
      await page.route('**/api/telemed/**', route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith('/catalog')) return route.fulfill({ json: { doctors: [{ id: 'doctor', name: 'แพทย์ทดสอบ', courses: [{
          courseId: 'course', courseItemId: 'item', courseName: 'ปรึกษาแพทย์', courseCode: 'TEST', price: 500, durationMinutes: 30,
          availability: [{ date: day, times: ['10:00'] }],
        }] }] } });
        if (path.endsWith('/beam/capabilities')) return route.fulfill({ json: { available: true, sandbox } });
        if (path.endsWith('/beam/bookings') && route.request().method() === 'POST') {
          creates.push(route.request().postDataJSON()); return route.fulfill({ json: payment() });
        }
        if (path.endsWith('/beam/bookings/booking')) return route.fulfill({ json: payment() });
        return route.fulfill({ json: [] });
      });
      await page.goto('http://localhost:3100/register/appointments');
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: 'เลือกวันและเวลา', exact: true }).click();
      await dialog.locator('.date-options button').click();
      await dialog.getByRole('button', { name: '10:00', exact: true }).click();
      await dialog.getByRole('button', { name: /ไปหน้าชำระเงิน/ }).click();
      await dialog.getByRole('button', { name: 'สร้าง QR พร้อมเพย์', exact: true }).waitFor();
      assert.equal(creates.length, 0, 'No charge on opening payment screen');
      if (!sandbox) {
        await dialog.getByText('Beam Production · QR นี้รับชำระเงินจริง', { exact: true }).waitFor();
        assert.equal(await dialog.getByRole('button', { name: 'สร้าง QR พร้อมเพย์', exact: true }).isDisabled(), true);
        await dialog.getByRole('checkbox', { name: 'ยืนยันสร้าง QR สำหรับชำระเงินจริง' }).check();
      }
      await dialog.getByRole('button', { name: 'สร้าง QR พร้อมเพย์', exact: true }).click();
      await dialog.locator('.beam-qr').waitFor();
      assert.equal(creates.length, 1);
      assert.equal(creates[0].expectedPrice, 500);
      assert.equal(creates[0].doctorId, 'doctor');
      assert.equal(await dialog.getByRole('button', { name: 'ย้อนกลับ', exact: true }).count(), 0);
      assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
      assert.equal(await dialog.locator('.beam-qr').evaluate(el => el.complete && el.naturalWidth > 0), true);
      await page.screenshot({ path: `/tmp/telemed-beam-${sandbox ? 'sandbox' : 'live'}-${width}.png`, fullPage: true });
      state = 'PAID';
      await dialog.getByRole('button', { name: 'ตรวจสอบผลชำระ', exact: true }).click();
      await dialog.getByText('ชำระค่าปรึกษาสำเร็จ', { exact: true }).waitFor();
      assert.equal(await dialog.locator('.beam-qr').count(), 0);
      assert.equal(creates.length, 1);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log('PASS: explicit QR creation, locked selection, responsive QR, backend-confirmed paid state, no duplicate POST; mocked APIs only.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
