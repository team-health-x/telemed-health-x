# Local registration integration

Registration is connected to HV1 Dev, not production. The Next server requires
TELEMED_DEMO_AUTH_ENABLED=true, TELEMED_WORKFLOW_ORIGIN and a server-only bridge
secret matching the backend. The backend pins clinic_uat_18 and the configured
Telemed branch. Never expose the bridge secret as a NEXT_PUBLIC variable.

The form requests an OTP challenge from the local server. Code 123456 is still a
Dev fixture, not an SMS. Verification produces an expiring phone-bound proof;
client-side otpVerified alone cannot submit a registration. Failed submissions
show an error and never display a fake success page. Duplicate retries reuse the
proof-derived idempotency key on the backend.

After HV1 confirms an active TL customer, the local opaque session is bound to
that returned customer ID and the browser navigates immediately to /register.
Later local OTP logins for that phone restore the same mapping. Booking requests
forward only the customer ID from the server-side session, not browser input.

The customer appears in the normal customer list for the Telemed branch without
pending-registration approval. Existing kiosk/HN signup remains unchanged.
Detailed registration requires migration 20260911100000_telemed_registration_details.
The separate booking migration is still needed before appointments can be stored.
Do not deploy this demo OTP to
production. Live SMS verification and production session persistence are not yet
implemented.

Full form, both addresses, health answers and consent choices are stored as a
snapshot in telemed_registration alongside the customer in one transaction.
Signature and optional identity photos are normalized PNG bytes in private DB
columns, not public URLs. JPEG/PNG uploads are limited to 3 MiB each before
normalization. The registration request body is redacted from application logs.
Staff with CUSTOMER_DETAIL_READ and access to the configured Telemed branch can
view the snapshot and attachments in the customer details Telemed tab. The API
checks clinic, branch and TL customer scope and returns Cache-Control: no-store.
Legacy customers are unchanged. Older Telemed registrations without a snapshot
show an empty state; no historical answers or evidence are fabricated.

The migration was applied only to clinic_uat_18 using the Dev-only migration
runner with --registration --apply. Production deployment is not part of this
local integration.

Telemed signup now has a separate identity namespace (backend migration
20260911110000_telemed_identity_namespace). An existing HN phone/document may be
used for a new TL registration. A phone already held by a TL in the same clinic
is still rejected; use login/account recovery instead. Each new TL starts with
an independent person_id link. This does not merge HN accounts, sessions, or
clinical/financial histories. A staff-reviewed, audited merge/unlink UI is future
work, not available in this local release.
