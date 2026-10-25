# Verification — 25 October 2026

- `npm run build`: **passed**, production initial bundle 293.63 kB, estimated transfer 80.72 kB. All lazy routes and Angular templates compiled.
- `npm test`: **19 tests passed** across 8 files.
- `npm audit`: **0 vulnerabilities**. Angular build currently pins an affected Vite release; the package override selects patched Vite 8.3.5. Build and tests pass with the override.
- `prettier --write`: source and configuration formatted successfully.

Automated tests cover:

- Exact combined book query parameter names and pagination.
- Multipart book creation and separate image replacement.
- Failed API response wrappers.
- Fresh filter choices after returning to catalog.
- Expired, malformed and non-admin token rejection.
- Login payload, session token and origin-scoped bearer interceptor.
- All admin feature routes redirecting to login without a session.
- Public catalog/details rendering without authentication.
- Whitespace validation and actual image size/extension constraints.
- Cancellation of outdated retry/filter requests.
- Cancellation of detail requests on dialog close/reopen.
- Author/category create/update/delete contracts.
- Required create image, invalid form rejection, complete paginated relationship choices.
- Explicit partial success when book metadata saves and cover replacement fails.

## Live read-only integration

Against `https://libsys.runasp.net`:

- Live Swagger downloaded and matched to local source.
- Books, authors and categories paginated list endpoints succeeded.
- Authors, categories and years filter endpoints succeeded.
- All seven nonempty combinations of author/category/year filters succeeded using the existing author 2, category 2 and year 1929.
- Book 7, author 2 and category 2 details succeeded.
- Returned book image URL responded HTTP 200.

The live database contained one active book during verification. No sample content was added.

## Remaining verification limits

- No administrator credentials were supplied. Successful live login, creates, edits, deletes and authenticated cover uploads were **not tested against production**. HTTP contract tests cover their frontend request shapes.
- Browser screenshot/desktop/mobile visual QA was **not completed**. The available Chrome window was minimized and the browser automation interface could not restore it. Responsive SCSS is implemented and templates compile, but screenshot fidelity, keyboard focus behavior in a real browser and mobile layouts still need manual review.
- The native dialog browser behavior is not fully emulated by jsdom; request-isolation tests stub only `showModal` and `close`.

No backend source, credentials, database content or business logic was modified.
