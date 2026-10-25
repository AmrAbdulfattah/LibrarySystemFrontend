# CRUD navigation and persistent authentication release

## Behavior

- Book creation and editing navigate to `/admin/books` only after all requested saves succeed, with success notifications. A new list instance reads fresh backend data in the server's existing deterministic title/ID ordering. Failed saves stay on the form. Existing metadata-then-image partial-failure handling is preserved.
- Author and Category create/edit dialogs close only after successful API confirmation and refresh the active management page. Failed saves retain the dialog and input.
- Deletion remains on the current list, waits for backend confirmation, refreshes data, preserves active book filters and recovers the previous valid page after deleting its final item. Duplicate in-flight submissions/deletions are blocked.
- Only View Website opens `/` in a new tab with `noopener noreferrer`. Other sidebar links remain in the current tab.
- Page sizes: **Public Books 12; Admin Books 10; Admin Authors 10; Admin Categories 10**. The shared pagination component preserves filter state and displays accurate backend totals/boundaries. Full dropdown choices remain independent of paginated table data.
- The pending shared 240px Author/Category select implementation is included in this release; see `dropdowns-pagination.md`.

## Authentication persistence

The previous token lived in sessionStorage, which ends with a browser tab's session. The existing backend returns a bearer access token and does not expose a cookie-login or refresh-token contract. The frontend now persists only the access token in localStorage, restores synchronously through an application initializer before protected routing, validates role and numeric `exp`, and uses that timestamp for expiry checks and timers. Frontend lifetime is never extended, and no token is generated or refreshed by the app.

Expiry removes the persisted/in-memory token and redirects protected pages to login. The session is rechecked on window focus and visibility changes to cover suspended/background tabs. Storage events synchronize login and logout between same-origin tabs. Manual logout removes persistent and legacy sessionStorage state. Matching API 401 responses invalidate the session; a delayed 401 for an older token does not log out a newer session. Only configured-API requests receive a currently valid bearer token.

Old sessionStorage-only sessions require one fresh login after the upgrade; they are discarded rather than resurrected after a persistent-session logout. After that login, the token survives refresh/tab closure/browser restart until its actual expiry, unless the user or browser clears site storage.

localStorage remains accessible to JavaScript and therefore vulnerable to XSS. No passwords, token-signing secrets or refresh tokens are stored. Existing Angular escaping/sanitization and HTTPS remain in place. Frontend decoding checks convenience state only; the backend still verifies signature, issuer, audience, lifetime and role authorization. No backend authentication settings, JWT duration, cookies, API contracts or business logic changed.

## Backend audit

Local ASP.NET source confirms one-based `pageNumber`/`pageSize` and a `GeneralResult.data` wrapper containing `items`, `pageNumber`, `pageSize`, `totalCount`, `totalPages`. Filtering and counts occur before `Skip((pageNumber-1)*pageSize).Take(pageSize)`. Book ordering is title then ID; Authors/Categories order by name then ID. No backend changes are required or included.

## Verification scope

Automated tests cover confirmed create/edit navigation, failure retention, duplicate submission protection, modal refresh, deletion recovery, all required page sizes and combined-filter pagination. Auth tests cover new app instance restoration, actual app initialization, exact expiry boundary, malformed/expired tokens, storage write failure, cross-tab login/logout, manual logout, focus recovery, bearer scoping and matching/stale 401s. Existing selectors retain complete paginated choices and numeric form IDs.

Live checks use only safe GET/OPTIONS requests and downloaded frontend assets. Successful production administrator login and production create/edit/delete are not exercised without test credentials/records. Physical browser closure/restart and full mobile/touch visual checks are not independently performed; persistence scenarios are verified with isolated app instances and storage events. Windows browser automation previously stopped because it could not identify the browser URL confidently.

Production uses the existing Vercel project `library-system-frontend`, stable domain `https://library-system-frontend-iota.vercel.app`, repository `AmrAbdulfattah/LibrarySystemFrontend` and main production branch. Deployment completion and exact commit correspondence are verified separately before the final report. Domain and environment variables are preserved.
