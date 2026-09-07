import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Program Resize sales page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="th"/i);
  assert.match(html, /<title>Program Resize \| โปรแกรมดูแลน้ำหนักที่ออกแบบเพื่อคุณ<\/title>/i);
  assert.match(html, /ลดน้ำหนักอย่างเข้าใจร่างกาย/);
  assert.match(html, /ลงทะเบียนรับคำปรึกษา/);
  assert.match(html, /คำถามที่พบบ่อย/);
  assert.match(html, /บริการหลักที่ดูแลคุณ/);
  assert.match(html, /MEDICAL SAFETY FIRST/);
  assert.match(html, /ไม่มีการจ่ายยาก่อนแพทย์ประเมิน/);
  assert.match(html, /พร้อมเริ่มต้นหรือยัง/);
  assert.match(html, /href="\/register"/);
  assert.doesNotMatch(html, /ชื่อ–นามสกุล|08X-XXX-XXXX|ยินยอมให้ทีมดูแล/);
  assert.doesNotMatch(html, /ล็อคอิน|เข้าสู่ระบบ|ChatGPT|OTP/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
});

test("registration is available on the same site with a link back to landing", async () => {
  const response = await render("/register");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /เริ่มลงทะเบียน/);
  assert.match(html, /กลับหน้า Program Resize/);
  assert.match(html, /class="telemed-site"/);
  assert.match(html, /href="\/"/);
  assert.doesNotMatch(html, /MEDICAL WEIGHT MANAGEMENT/);
});
