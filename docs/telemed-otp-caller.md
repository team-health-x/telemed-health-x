# Trusted OTP caller contract

Both login `auth/send-otp` and registration `signup-otp/send` require:

- Server-only `TELEMED_OTP_CALLER_HMAC_KEY` (at least 32 characters), identical to
  the backend caller key and different from the bridge secret.
- `TELEMED_CLINIC_ID` and `TELEMED_BRANCH_ID`, identical to the backend scope.
- A distinct server-only `TELEMED_OTP_INGRESS_HMAC_KEY` (at least 32 characters),
  shared only with the admitted ingress, never with browsers.

An admitted ingress derives the client address from its authenticated connection
and overwrites `x-telemed-ingress-caller`, `x-telemed-ingress-at` (13-digit epoch
milliseconds) and `x-telemed-ingress-signature`. The signature is lowercase hex
HMAC-SHA256 using the ingress key over UTF-8 JSON.stringify of
`[configuredPublicOrigin, clientIP, timestampString]`. Evidence is accepted only
within 60 seconds of server time, on HTTPS public origins. The ingress must strip
browser-supplied evidence before signing and its signing endpoint must never be
publicly callable. Raw `Forwarded`, `X-Forwarded-For`, client device headers and
client-supplied backend attestation headers grant no authority. An unsigned
direct request fails closed. TLS and ingress acceptance remain operating gates.

The BFF creates a random device nonce and keeps its signed proof in
`__Host-telemed_otp_device`: host-only, HttpOnly, Secure, SameSite=Strict, path `/`,
30 days. A valid cookie reuses the nonce across signup and login. Missing or forged
cookies cause a new server-generated nonce; no browser-selected ID is signed.
Cookie clearing can change a device, so backend phone, caller, peer and device
limits all remain mandatory.

The BFF signs `[clinicId, branchId, purpose, phone, clientIP, deviceNonce,
timestampString]` with the separate caller key for the backend's four OTP headers.
It never forwards incoming caller headers or exposes keys/proofs in JSON. OTP
fetches reject redirects. No local bypass is added to the real send endpoints.

No ingress is admitted or configured by this patch. Missing keys/evidence refuse
sends; real OTP/provider acceptance and activation remain held. This source
contract is verified offline against the paired backend verifier, not a live edge.
