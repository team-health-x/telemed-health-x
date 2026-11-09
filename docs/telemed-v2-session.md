# Telemed V2 customer session patch

The BFF forwards the opaque backend session in server-to-server headers and keeps it in a host-only HttpOnly cookie. Server-rendered customer pages use the same backend introspection. Logout must be acknowledged before clearing the cookie. Old local tickets do not authorize V2 access.

The backend owns the 60-minute sliding idle deadline and the eight-hour absolute deadline. Login and registration set eight-hour cookie custody; activity checks never restart that cookie lifetime. Activity or a protected request can extend only the backend idle deadline. Expiry requires a fresh login OTP.

Default activation remains closed. Keep TELEMED_PRODUCTION_ENABLED=false and backend TELEMED_V2_ENABLED=false until separately accepted. When activation is approved, TELEMED_V2_API_ORIGIN must be an exact HTTPS origin and must match TELEMED_API_ORIGIN and TELEMED_WORKFLOW_ORIGIN. Configure socket and public origins through the existing deployment configuration. No credentials or live origins are supplied by this patch.

The maintenance banner follows the backend capability response and stays visible if that response is unavailable or malformed.

Local checks:

- node node_modules/typescript/bin/tsc --noEmit -p tsconfig.next.json
- node --experimental-strip-types --test tests/telemed-api-origin.test.ts tests/telemed-dev-policy.test.ts tests/telemed-production-policy.test.ts tests/telemed-v2-session.test.mjs
- node --test tests/mock-registration-submit.test.cjs tests/telemed-chat-proxy.test.cjs tests/telemed-payment-proxy.test.cjs tests/telemed-production-session.test.cjs
- node node_modules/next/dist/bin/next build --webpack

This source patch and local build do not certify a deployed customer image, hosted OTP/Beam journeys, ingress/cookie acceptance or production activation.
