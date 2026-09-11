# HV1 catalog integration

Set server-only `TELEMED_API_ORIGIN` in `.env.local` (see `.env.example`).
The same-origin GET `/api/telemed/catalog` proxies only the fixed public catalog
endpoint, without staff tokens or arbitrary branch parameters. Errors do not fall
back to mock doctors, courses, or times.

`/register/appointments` opens the restored original `BookingSheet` without running
registration. The patient application's appointment and change-date buttons use
the same component. Cards select the doctor/course; the Next button advances to
the original date buttons and time buttons, followed by payment and slip UI.
Submission now calls the Dev booking API: it creates an appointment and sale order,
uploads evidence and awaits staff payment review. It requires a logged-in local
demo session, a mapped Dev TL customer, the new backend migration, and server-only
`TELEMED_WORKFLOW_ORIGIN` / `TELEMED_DEMO_BRIDGE_SECRET`. Without these it fails
closed with a visible error. Port 3102 is catalog-only and cannot accept bookings.
The QR and bank details remain prototypes: never transfer real funds. Uploading
evidence does not mark payment successful or issue a receipt. Staff records payment
in the existing HV1 sale-order workflow, approves review, then supplies a meeting
link on the appointment page. The customer appointment tab shows the saved status.
The replacement `TelemedCatalogSheet` has been removed. Other
prototype features (registration/OTP, history, prescriptions, video) remain outside
this integration and must not be treated as production-ready patient workflows.

The backend must enable its fixed Telemed branch and clinic configuration. Demo
doctors share CC-TL-DEMO01 through the existing DOCTOR course-operator role.

Run the preview with `pnpm dev:vercel --port 3100 --hostname 127.0.0.1`.
Browser checks: `PLAYWRIGHT_MODULE=<path-to-playwright/index.mjs> node tests/telemed-catalog-browser.mjs`.
The browser regression test intercepts the catalog with deterministic fixtures,
tests three screen widths, the four-step flow, back/reset behavior, file validation
and loading/error/retry/empty states. Booking writes are intercepted too: the test
checks the submitted offering, price, same-key retry and success redirect without
writing to Dev. See backend `src/api/telemed/WORKFLOW.md` for setup and limitations.
