# Local demo login

Requires Node.js 22.17+ (experimental built-in SQLite) and `next dev`.
Set `TELEMED_DEMO_AUTH_ENABLED=true` in `.env.local`, then open `/login`
on localhost or 127.0.0.1. The flag is ignored outside development.

- Demo phone: `0000000001`; OTP: `123456`.
- No SMS is sent. Only the isolated `TL-DEMO-LOGIN01` fixture can log in.
- This is not customer authentication and does not grant access to HV1 data.
- Sessions last 30 days and extend to 30 days from the first active request
  each Bangkok calendar day. Idle tabs do not periodically extend sessions.
- Logout revokes the server session immediately. A new login replaces the
  previous session in the same browser.
- The HttpOnly, SameSite=Strict cookie contains an opaque random token.
  Only its hash is stored in `.local/telemed-demo-auth.sqlite` (gitignored).
  Keep this file to retain sessions across local server restarts.
- OTP challenges expire after five minutes, allow five attempts, and can
  only be consumed once. Resends are rate limited. Demo codes must never
  be reused for production authentication.
- Registration and other prototype screens are separate from this fixture.
  Real SMS, verified customer identity, production session storage, and
  deployment security configuration are still required for production.

Run store tests:

```sh
node --experimental-strip-types --test tests/demo-auth-store.test.ts
```
