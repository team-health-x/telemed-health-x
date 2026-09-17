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
  assert.match(html, /Resize ใกล้คุณ/);
  assert.match(html, /ลงทะเบียนรับคำปรึกษา/);
  assert.match(html, /คำถามที่พบบ่อย/);
  assert.match(html, /ปรึกษาปัญหาลดน้ำหนักกับแพทย์ผู้ชำนาญการ/);
  assert.match(html, /MEDICAL SAFETY FIRST/);
  assert.match(html, /ทุกแผนของ Resize เริ่มจากการประเมินความเหมาะสมโดยแพทย์/);
  assert.match(html, /doctor-introduction\.mp4/);
  assert.match(html, /program-doctor-assessment\.webp/);
  assert.match(html, /ประสบการณ์จากผู้รับบริการ/);
  assert.match(html, /review-video-4\.mp4/);
  assert.match(html, /ผลข้างเคียงที่พบบ่อยมีอะไรบ้าง/);
  assert.doesNotMatch(html, /<details\b|<summary\b/);
  assert.match(html, /ลงทะเบียนเพื่อจองคิวปรึกษาแพทย์ผู้ชำนาญการ/);
  assert.match(html, /พร้อมเริ่มต้นหรือยัง/);
  assert.match(html, /href="\/register"/);
  assert.doesNotMatch(html, /ชื่อ–นามสกุล|08X-XXX-XXXX|ยินยอมให้ทีมดูแล/);
  assert.match(html, /href="\/login"/);
  assert.doesNotMatch(html, /ล็อคอิน|ChatGPT|OTP/);
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
