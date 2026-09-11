# Telemed Dev deployment (Next.js / Vercel)

Registration creates real persisted TL customers, registration details and
consents in the configured database, not a demo account. The canonical backend
endpoint is `POST /api/v1/telemed/register`. The previous
`/api/v1/telemed/workflow/demo/register` remains only as a rollout alias.
Only OTP verification is mocked. Confirming registration sends the form directly
to the registration endpoint, with no send-OTP or verify-OTP requests.

Login uses the registered primary phone and mock OTP `123456`. Clicking Request
OTP is local UI only; submitting login calls the backend to find exactly one
active TL customer in the configured Dev clinic/branch. Unknown or duplicate
phones are rejected. Legacy HN accounts are never used as a fallback.

## Security boundary

This is TEST authentication, not proof of phone ownership. Restrict access using
Deployment Protection, a VPN, or an authenticated gateway before enabling it.
Do not expose patient data to the public with a known OTP. Origin allowlisting
is CSRF protection, NOT user authentication or network access control.

## Frontend

Build with `pnpm build:vercel` (Next.js), not the default vinext/Workers build.
Use Node >=22.13. Set environment variables in the correct Vercel target
(Preview or Production), then redeploy:

```dotenv
NODE_ENV=production
TELEMED_DEPLOY_ENV=dev
TELEMED_DEMO_AUTH_ENABLED=true
TELEMED_DEV_ORIGINS=https://YOUR-EXACT-DEV-HOST
TELEMED_API_ORIGIN=https://YOUR-BACKEND-DEV-HOST
TELEMED_WORKFLOW_ORIGIN=https://YOUR-BACKEND-DEV-HOST
TELEMED_DEMO_BRIDGE_SECRET=RANDOM-SERVER-SECRET-AT-LEAST-32-CHARACTERS
TELEMED_SESSION_SECRET=ANOTHER-RANDOM-SECRET-AT-LEAST-32-CHARACTERS
```

Origins are comma-separated exact HTTPS origins without trailing slashes. No
wildcard preview domains. The external Host must be preserved by the proxy.
Keep secrets server-only, never NEXT_PUBLIC. Login links and the login page are
always visible; authentication still fails closed if Dev configuration is absent.

## Backend

Deploy `demo/login` and the matching Telemed code. Configure:
`TELEMED_DEPLOY_ENV=dev`, `TELEMED_WORKFLOW_ENABLED=true`, the same bridge secret,
and existing clinic, branch, creator, registration and catalog settings.
The bridge still requires the approved Dev host and `clinic_uat_18` database.
No migration is introduced by this login change. Local and Dev share customer
data: do not reset or seed over existing records.

## Sessions and registration

Sessions now use server-signed tickets in HttpOnly cookies;
no SQLite file or persistent volume is required. Existing SQLite sessions no
longer work: log in again with the registered phone. Signup-issued sessions and
login-issued sessions use the same customer ID. Cookies are Secure on HTTPS.

Sessions expire after eight hours without sliding renewal. Logout clears the
browser cookie, but does not revoke a copied token on the server. Rotate the
session secret to invalidate all sessions. This limitation and replayable mock
signup proofs are Dev-only; production requires real OTP, rate limiting and
revocable sessions. Registration confirmation calls `/api/telemed/register`
directly with the mock code and a stable request UUID, never the OTP endpoints.
The Dev-only route validates the mock code and derives a phone-bound registration
key to keep retries idempotent; this is not proof of phone ownership.

## Verification

Check login links, request OTP without a network call, reject wrong OTP, log in
with an existing phone, verify the correct TL account and its booking history,
then logout. Unknown, inactive, duplicate and HN-only phones must not log in.
Test signup separately without overwriting existing shared Dev data.

Deploy Front V1 `bo-telemed` for staff payment review and meeting controls.
