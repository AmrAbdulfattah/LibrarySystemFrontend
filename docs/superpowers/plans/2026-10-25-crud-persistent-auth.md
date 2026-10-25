# CRUD navigation, fixed pagination and persistent authentication

Build on the pending shared selector/pagination changes. Implement the fully specified user workflow directly and publish all intended frontend changes in one requested commit. Preserve UI, backend contracts, actual JWT expiry, production domain and Vercel environment settings.

- [x] Test persistent token restoration, actual expiry, cross-tab logout/login, protected routing, bearer scoping and 401 handling.
- [x] Replace session token storage with localStorage and initialize synchronously before routes. Clean up expired tokens/listeners/timers; recheck on focus/visibility. Backend bearer contract remains unchanged; no refresh or cookie scheme is invented.
- [x] Test create/edit success/failure/duplicate submissions and delete confirmation/refresh/page recovery for Books/Authors/Categories.
- [x] Return book forms to management list after confirmed save; retain named modal close/refresh behavior. Open only View Website in a new tab.
- [x] Request 12 public books, 10 admin books/authors/categories with exact server contracts. Preserve complete selector choices and pending pagination fixes.
- [x] Run all tests, production build, review; verify local server. 84 tests passed; build passed; fresh reviewer found no blockers.
- [ ] Commit `Improve CRUD navigation and implement consistent pagination`, push existing main, verify exact commit automatically deploys READY to the existing production domain.
- [ ] Verify live routes, bundle content, API reads and page sizes without mutating production records; explicitly report browser/mutation limitations.

Security: only the existing access token persists; passwords and JWT secrets never persist. Frontend decode checks role/expiry only; server verifies signature, issuer, audience, lifetime and authorization. localStorage is accessible to script and requires continuing XSS hygiene. Existing sessionStorage keys are removed rather than used to resurrect logged-out sessions.
