# Telemed Azure container

This image is for infrastructure preparation, not a production launch approval.

- Registry: `healthxregistry.azurecr.io`
- Repository: `healthx-telemed-web`
- Ingress target port: `3000`
- Startup command: use the image default (`node server.js`).
- Default environment: `TELEMED_DEPLOY_ENV=prod`, `TELEMED_DEMO_AUTH_ENABLED=false`.
- No backend URL, database credentials, bridge secret or session secret is baked in.
- Without explicit API origins, production catalog/payment endpoints return 503.
- Existing mock registration/login remain disabled in production. Real OTP and
  production authentication must be implemented and verified before launch.

For DNS preparation, leave API origins and credentials unset. Do not copy Dev
environment settings or enable mock authentication on a public production app.

Build with the Dockerfile and the frozen pnpm lockfile. Publish an immutable
version tag alongside `prod`; creating/pushing an image does not deploy an app.
Set `TELEMED_API_ORIGIN` and `TELEMED_WORKFLOW_ORIGIN` at runtime only when ready
to connect the intended backend. Use Azure Secrets for runtime secrets.
