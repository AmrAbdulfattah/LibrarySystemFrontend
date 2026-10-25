# Scrollable selectors and pagination

Goal: preserve existing layouts while bounding all Author/Category menus and verifying server pagination throughout the application.

Approach: native select popups cannot be reliably sized. Use one dependency-free ControlValueAccessor with a 240px, internally scrollable listbox, existing design tokens, typed string/number IDs, keyboard/typeahead navigation, outside dismissal and viewport-aware positioning. Use the browser Popover API for top-layer rendering where supported, with a positioned fallback. Publication year remains native.

Backend contracts inspected: GET /api/books, /api/authors and /api/categories accept pageNumber/pageSize and wrap PagedResult items/pageNumber/pageSize/totalCount/totalPages in GeneralResult data. Book filters use authorId/categoryId/publicationYear. Filter-option endpoints return complete unpaginated lists. Book forms already load all pages of relationship options; preserve that separation.

- [x] Write failing selector integration, keyboard, dismissal, typed-value and placement tests.
- [x] Implement shared select and apply to book forms and public/admin filters.
- [x] Test all list/filter pagination paths, boundaries, retries, complete options and payloads; fix findings.
- [x] Highlight current page using existing tokens and retain totals/disabled boundaries.
- [x] Run whole suite, production build and live read-only pagination checks.
- [x] Review final changes and report exact coverage and limitations.
- [ ] Real browser visual/touch verification: Computer Use stopped because current browser URL could not be identified confidently.

Review: a fresh reviewer found no blocking defects. Failing tests reproduced native selector/pagination gaps, duplicate requests, malformed routes and offscreen placement; fixes passed subsequent runs. See docs/dropdowns-pagination.md for contracts and verification limits.

Constraints: no added dependencies, backend/UI redesign, production data mutations, commits, pushes or deployments. Work in the current user-selected workspace; explicit existing instruction is to change this project directly without further permission questions.
