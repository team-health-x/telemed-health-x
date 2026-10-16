// Local UI test: all browser API calls are intercepted; no patient/DB writes or Telegram sends.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { readFileSync } = require('node:fs');
const { parseEnv } = require('node:util');
const { createHmac } = require('node:crypto');
const assert = require('node:assert/strict');
const env = parseEnv(readFileSync('.env.local', 'utf8'));
const secret = process.env.TELEMED_SESSION_SECRET || env.TELEMED_SESSION_SECRET || env.TELEMED_DEMO_BRIDGE_SECRET;
const origin = process.env.TELEMED_TEST_ORIGIN || 'http://localhost:3100';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname));
assert.ok(secret?.length >= 32, 'Local session secret required');
const ticket = Buffer.from(JSON.stringify({ kind: 'session', expiresAt: Date.now() + 600000, nonce: 'chat-ui-test',
  customer: { customerId: 'TL-CHAT-TEST', name: 'Chat UI Test', phone: '0812345678' } })).toString('base64url');
const token = `${ticket}.${createHmac('sha256', secret).update(`telemed-dev-v1:${ticket}`).digest('base64url')}`;
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE } : {}) });
  let page;
  try {
    page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.context().addCookies([{ name: 'telemed_demo_session', value: token, url: origin, httpOnly: true }]);
    const messages = [{ id: 'm1', sequence: 1, sender_kind: 'STAFF', text: 'สวัสดีค่ะ ส่งเอกสารทางนี้ได้เลยค่ะ', file_name: null, file_mime: null, created_at: new Date().toISOString() }];
    const requests = []; let failSend = true; let olderLoaded = false; let chatEnabled = true;
    let socket;
    await page.routeWebSocket('ws://localhost:3100/test-chat-socket', ws => {
      socket = ws;
      ws.onMessage(() => ws.send(JSON.stringify({ bookingId: 'booking-test', unread: 2, sequence: 1 })));
    });
    await page.route('**/api/telemed/**', async route => {
      const request = route.request(); const url = new URL(request.url()); const path = url.pathname;
      const fulfill = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
      if (path.endsWith('/chat/socket')) return fulfill({ ticket: 'fixture', url: 'ws://localhost:3100/test-chat-socket' });
      if (path.endsWith('/chat/read')) {
        socket?.send(JSON.stringify({ bookingId: 'booking-test', unread: 0, sequence: messages.at(-1).sequence }));
        return fulfill({ ok: true });
      }
      if (path.endsWith('/chat') && request.method() === 'POST') {
        const data = request.postDataJSON(); requests.push(data);
        if (failSend) { failSend = false; return fulfill({ error: 'ทดสอบการเชื่อมต่อขัดข้อง' }, 503); }
        messages.push({ id: `m${messages.length + 1}`, sequence: messages.length + 1, sender_kind: 'CUSTOMER', text: data.text,
          file_name: data.file?.name || null, file_mime: data.file?.mime || null, created_at: new Date().toISOString() });
        return fulfill({ id: messages.at(-1).id });
      }
      if (path.endsWith('/chat')) {
        if (url.searchParams.has('before')) { olderLoaded = true; return fulfill({ items: [{ ...messages[0], id: 'old', sequence: 0, text: 'ข้อความก่อนหน้า' }], nextBefore: null }); }
        return fulfill({ items: messages, nextBefore: olderLoaded ? null : 1 });
      }
      if (path.endsWith('/file')) return fulfill({ data: Buffer.from('%PDF-1.4\n').toString('base64'), name: 'document.pdf', mime: 'application/pdf' });
      if (path.endsWith('/bookings')) return fulfill([{ id: 'booking-test', chatEnabled, state: 'CONFIRMED', doctorName: 'แพทย์ทดสอบ',
        courseName: 'คำปรึกษา Telemed', date: '2026-09-22', time: '10:00', price: 500, saleOrderId: 'TEST-001', meetingUrl: null }]);
      if (path.includes('/auth/')) return fulfill({ ok: true });
      return fulfill({ doctors: [], items: [] });
    });
    await page.goto(`${origin}/register?tab=appointments`);
    await page.locator('.telemed-chat-unread').filter({ hasText: '2' }).waitFor();
    await page.screenshot({ path: '/tmp/telemed-chat-unread-desktop.png' });
    await page.getByRole('button', { name: /แชทกับเจ้าหน้าที่/ }).first().click();
    const dialog = page.getByRole('dialog', { name: 'แชท Telemed' });
    await dialog.getByText('สวัสดีค่ะ ส่งเอกสารทางนี้ได้เลยค่ะ').waitFor();
    await page.locator('.telemed-chat-unread').waitFor({ state: 'detached' });
    await dialog.getByRole('button', { name: 'ข้อความก่อนหน้า', exact: true }).click();
    await dialog.getByText('ข้อความก่อนหน้า', { exact: true }).waitFor();
    await dialog.getByRole('textbox', { name: 'ข้อความ', exact: true }).fill('ขอสอบถามเอกสารค่ะ');
    await dialog.getByRole('button', { name: 'ส่งข้อความ', exact: true }).click();
    await dialog.getByRole('alert').filter({ hasText: 'ทดสอบ' }).waitFor();
    assert.equal(await dialog.getByRole('textbox', { name: 'ข้อความ', exact: true }).inputValue(), 'ขอสอบถามเอกสารค่ะ');
    await dialog.getByRole('button', { name: 'ส่งข้อความ', exact: true }).click();
    await dialog.getByText('ขอสอบถามเอกสารค่ะ', { exact: true }).waitFor();
    assert.equal(requests[0].requestKey, requests[1].requestKey, 'Retry must use identical idempotency key');
    await page.waitForFunction(() => !document.querySelector('.telemed-chat textarea').disabled);
    await page.waitForTimeout(300);
    await dialog.locator('input[type=file]').setInputFiles({ name: 'document.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n') });
    await dialog.getByRole('button', { name: 'ลบไฟล์แนบ' }).waitFor();
    await dialog.getByRole('button', { name: 'ส่งข้อความ', exact: true }).click();
    await dialog.getByRole('button', { name: 'document.pdf', exact: true }).waitFor();
    const download = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'document.pdf', exact: true }).click();
    assert.equal((await download).suggestedFilename(), 'document.pdf');
    await page.screenshot({ path: '/tmp/telemed-chat-desktop.png' });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(200);
      const bounds = await dialog.boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, 'Dialog must fit mobile');
      assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, 'No horizontal overflow');
    }
    await page.screenshot({ path: '/tmp/telemed-chat-mobile.png' });
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
    const launcher = page.getByRole('button', { name: 'แชทกับเจ้าหน้าที่', exact: true });
    assert.equal(await launcher.evaluate(el => getComputedStyle(el).position), 'fixed');
    await page.waitForFunction(() => document.activeElement === document.querySelector('.telemed-chat-launcher'));
    await page.screenshot({ path: '/tmp/telemed-chat-launcher-mobile.png' });
    socket.send(JSON.stringify({ bookingId: 'booking-test', unread: 105, sequence: 110 }));
    await page.locator('.telemed-chat-unread').filter({ hasText: '99+' }).waitFor();
    await page.screenshot({ path: '/tmp/telemed-chat-unread-mobile.png' });
    chatEnabled = false;
    await page.reload();
    await page.getByText('TEST-001', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'แชทกับเจ้าหน้าที่', exact: true }).click();
    const picker = page.getByRole('dialog', { name: 'แชทกับเจ้าหน้าที่', exact: true });
    await picker.getByText('แชทยังไม่พร้อมใช้งาน').waitFor();
    assert.equal(await picker.locator('.telemed-chat-booking').isDisabled(), true);
    await page.keyboard.press('Escape'); await picker.waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
    console.log('PASS: chat rendering, pagination, retry, attachment send/download, mobile layout and Escape close. No real API writes.');
  } catch (error) {
    if (page) { await page.screenshot({ path: '/tmp/telemed-chat-failure.png' }); console.error(await page.locator('dialog').allTextContents()); }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
