# Telemed shared Dev deployment

This is an internal test deployment, not production authentication. OTP remains
the existing test code. Restrict ingress to the team (VPN, IP allowlist or an
authenticated gateway) BEFORE enabling test auth. Origin validation is not an
authentication barrier. Never expose this deployment publicly with patient data.

## Runtime

- Use Node >=22.13 and the Next.js server, not Workers/serverless.
- Build: `pnpm build:vercel`; run: `pnpm start:vercel --hostname 0.0.0.0 --port 3000`.
- Run exactly one replica and one Node process. Avoid overlapping revisions.
- Mount a persistent LOCAL filesystem volume at `/data/telemed`. Verify SQLite
  locking is supported; do not use network shares without verified locking.
- SQLite holds login customer mappings as well as sessions. Shared PostgreSQL
  does NOT synchronize these mappings from a local workstation. Back up the
  SQLite file while stopped and transfer it securely if existing local test
  accounts must log in. Do not commit or bake this file into an image.
- Multi-replica/serverless deployments require a shared session store first.

## Frontend runtime environment

```dotenv
NODE_ENV=production
TELEMED_DEPLOY_ENV=dev
TELEMED_DEMO_AUTH_ENABLED=true
TELEMED_DEV_ORIGINS=https://YOUR-TELEMED-DEV-HOST
TELEMED_SESSION_DB_PATH=/data/telemed/auth.sqlite
TELEMED_API_ORIGIN=https://YOUR-BACKEND-DEV-HOST
TELEMED_WORKFLOW_ORIGIN=https://YOUR-BACKEND-DEV-HOST
TELEMED_DEMO_BRIDGE_SECRET=SET-A-RANDOM-SECRET-AT-LEAST-32-CHARACTERS
```

Keep secrets server-side. Use exact HTTPS origins without trailing slashes,
comma-separated if needed. Proxy must preserve the external Host header.
Forwarded headers are not trusted. HTTPS cookies remain Secure behind TLS proxy.

## Backend and back office

Deploy the matching Telemed backend changes. Set `TELEMED_DEPLOY_ENV=dev`,
`TELEMED_WORKFLOW_ENABLED=true`, the SAME bridge secret, and the existing
`TELEMED_CLINIC_ID`, `TELEMED_BRANCH_ID`, `TELEMED_CREATED_BY_USER_ID` values.
Retain other existing registration/catalog configuration. The bridge still
requires the exact approved `clinic_uat_18` Dev database host and name.
No schema change is introduced by this deployment patch; verify existing
Telemed migrations, do not reset or reseed the shared database.
Deploy the updated back office for payment review and meeting-link controls.

## Smoke test

Verify unknown hosts and cross-origin POSTs are rejected. Verify login cookie is
Secure/HttpOnly, then signup/login, booking, payment review, meeting confirmation
and history. Restart the frontend and confirm session survives. Coordinate test
records because local and hosted Dev modify the same PostgreSQL data.

The normal Next build uses `tsconfig.next.json` so Workers-specific source files
are not compiled as part of the Node deployment. Do not disable type checking.
