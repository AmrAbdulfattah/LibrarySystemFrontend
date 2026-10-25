# Vercel production deployment

- Live website: https://library-system-frontend-iota.vercel.app
- Admin login: https://library-system-frontend-iota.vercel.app/admin/login
- Project: `library-system-frontend`
- Vercel account scope: `amrabdulfattah2-2163s-projects`
- GitHub: `AmrAbdulfattah/LibrarySystemFrontend`, production branch `main`.
- Framework: Angular, client-side rendering; no SSR.
- Root: repository root.
- Node: `24.x`.
- Install: `npm ci`.
- Build: `npm run build`.
- Output: `dist/library-system/browser`.
- API: `https://libsys.runasp.net/api`, configured by `public/config.json`.

`vercel.json` configures the build and SPA fallback, so direct Angular routes and refreshes serve the application. Runtime configuration revalidates rather than remaining indefinitely cached. Local `.vercel` metadata, environment files, dependencies, build artifacts, secrets, and temporary files are excluded from Git and deployment uploads.

Vercel confirmed the initial production deployment READY. Build and all 19 tests passed. Unauthenticated HTTP checks confirmed the homepage, `/books/7`, `/admin/login`, `/admin/books`, `/admin/authors`, and `/admin/categories` return application HTML, while bundled JavaScript, CSS, and `/config.json` remain accessible as static files.

Browser checks confirmed real catalog data/covers, publication-year and author filtering, combined author/category/year state, book details at `/books/8`, route refresh, and unauthenticated `/admin/books` redirection to login. Backend HTTPS connectivity and CORS preflight succeeded for the actual production origin; no backend change was required.

Successful admin login, authenticated management pages and production mutations were not tested on the deployed domain. Existing automated tests cover guards, JWT scoping, CRUD request contracts, forms, and upload payloads. Pagination is integrated but the live catalog did not have enough books to exercise a second page during deployment verification. Browser console errors and a full responsive visual review were not checked.

Only deployment configuration and documentation changed; application components, styling, API routes, and backend business logic were preserved.
