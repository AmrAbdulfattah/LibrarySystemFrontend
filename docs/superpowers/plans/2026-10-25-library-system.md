# Library System Implementation Plan

Goal: implement the supplied read-only catalog and protected admin CRUD against verified ASP.NET contracts.
Architecture: Angular 22 standalone lazy routes, typed HttpClient services, reactive forms, signals, shared display and dialog components. SCSS follows the two exports under design/.
Specification: supplied task attachment; endpoints verified from D:/LibrarySystem and swagger.json.

- [x] Inspect both design documents, HTML files, screenshots, controllers, DTOs, validators, auth and image implementation.
- [x] Scaffold Angular and typed API layer; test combined filtering, request formats and response errors.
- [x] Build catalog, filters, cards, pagination, details and read states.
- [x] Build login, scoped token interceptor, expiry-aware admin guard and logout; test protection.
- [x] Build admin layout, reusable book form and image replacement, confirmation and notifications.
- [x] Build paginated authors/categories CRUD with shared forms and API detail views.
- [x] Run build, tests and live read checks; document routes, contracts and limitations.
- [ ] Complete real browser desktop/mobile visual verification (automation cannot restore minimized Chrome).

Final evidence: 19 tests passed, production build passed, npm audit zero vulnerabilities. Reviewer identified three request lifecycle issues; failing regression tests reproduced them, fixes passed, reviewer confirmed. See docs/verification.md for the exact tested scope and remaining live authenticated verification.

Review focus: cancelled filter requests, expired sessions, image failure after metadata save, paginated selection completeness, deletion of final page item.
Ruling: implement directly from the user's detailed specification and explicit start instruction; do not add an approval stage. No Git repository exists, so implement in the requested workspace.
