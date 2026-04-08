# fcc-applicants-pwa

Standalone FCC applicant-facing PWA built with Vue 3 (Composition API), Element Plus, Tailwind CSS, Pinia, and Vue Router.

## Quick start

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:5070`

## Build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm run test:unit
npm run test:e2e
```

## Environment

- `VITE_APPLICANT_API_BASE_URL`: backend API base URL (default `http://localhost:5050/api/v1`)
- `VITE_APPLICANT_USE_MOCKS`: set to `true` for mock API mode

Use `localhost` consistently in development. Mixing `localhost` and `127.0.0.1` makes cookie-backed auth flows fail intermittently.

## Applicant Services

Applicants can apply for:
- Trademark Recordation
- Merger Clearence
- SFCC Registration
- Legal Opinion
- Exemption

Applications menu structure:
- Applications Overview: `/portal/applications`
- Service Overview: `/portal/applications/:serviceKey`
- Creation Wizard: `/portal/applications/:serviceKey/create`
- Update Wizard: `/portal/applications/:serviceKey/:id/edit`
- Details Page: `/portal/applications/:serviceKey/:id`

Portal navigation structure:
- Dashboard
- Applications
  - Applications Overview
  - Trademark Recordation
  - Merger Clearence
  - SFCC Registration
  - Legal Opinion
  - Exemption
- Certificates
- Payments
- Support
- Settings
- Profile (top navbar)

## Real backend integration

This app is wired to FCC backend endpoints:
- `POST /api/v1/user-management/accounts/create/applicant`
- `POST /api/v1/user-management/auth/login`
- `GET|POST /api/v1/sfcc/applications`
- `GET /api/v1/sfcc/process-automation/registration-template`
- `GET /api/v1/payments/queries/application/:applicationId`
- `GET /api/v1/notifications/unread-count`
- `GET /api/v1/applicants/search`
- `GET /api/v1/applicants/:applicantId/profile`
