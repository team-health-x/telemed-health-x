const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');

// Run inside the built image with no backend configuration or secrets.
const server = spawn(process.execPath, ['server.js'], { stdio: 'inherit' });
const base = 'http://127.0.0.1:3000';
async function run() {
  assert.equal(process.env.TELEMED_DEPLOY_ENV, 'prod');
  assert.equal(process.env.TELEMED_DEMO_AUTH_ENABLED, 'false');
  assert.equal(fs.existsSync('/app/.env.local'), false);
  let home;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      home = await fetch(base, { signal: AbortSignal.timeout(2000) });
      if (home.ok) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.equal(home?.status, 200, 'home page');
  const html = await home.text();
  const asset = html.match(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/);
  assert.ok(asset, 'rendered page references static assets');
  assert.equal((await fetch(new URL(asset[1], base))).status, 200, 'static asset');
  for (const [path, method, expected] of [
    ['/api/telemed/catalog', 'GET', 503],
    ['/api/telemed/payment-methods', 'GET', 503],
    ['/api/telemed/register', 'POST', 503],
    ['/api/telemed/auth/send-otp', 'POST', 404],
    ['/api/telemed/auth/verify-otp', 'POST', 404],
  ]) {
    const response = await fetch(base + path, { method, signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, expected, path);
    console.log('PASS', path, expected);
  }
  console.log('PASS production image: page, static asset, no local env, backend unconfigured, mock auth blocked');
}
run().then(() => { server.kill(); process.exit(0); }, error => {
  console.error(error);
  server.kill();
  process.exit(1);
});
