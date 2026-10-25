# Library System

Angular 22.2 standalone frontend for the ASP.NET Core Library System. The public catalog is read only; admin routes provide Books, Authors and Categories CRUD. Styles use the supplied Stitch exports in `design/`, Newsreader, Plus Jakarta Sans, forest green and warm cream. There is no mock data in the application.

## Run

Requires Node `^22.22.3 || ^24.15.0 || >=26.0.0` (developed with 24.15.0).

```sh
npm ci
npm start
```

Open http://localhost:4200. Admin login: http://localhost:4200/admin/login. Use an existing backend administrator account; no credentials or secrets are included.

```sh
npm test
npm run build
```

Production files are in `dist/library-system/browser`. Serve this directory with SPA fallback to `index.html` for frontend routes. Serve `config.json` with revalidation so configuration changes take effect. Use HTTPS in production.

## Configuration

Set `public/config.json` → `apiBaseUrl` to the backend API root, currently `https://libsys.runasp.net/api`. The app loads it before bootstrapping; deployed configuration can be edited without recompiling. The backend must allow the frontend origin through CORS. Relative image paths resolve against the configured backend origin; absolute backend image URLs are preserved. Google Fonts supplies the two design fonts.

Authentication follows the backend's JWT design. The token is stored in sessionStorage, expires according to its JWT expiry, and is sent only to the configured API. Admin navigation checks the Admin role; backend authorization remains authoritative. HTTP 401 clears the session, 403 displays a permission error. There is no registration or refresh-token endpoint.

## Architecture

- `src/app/core`: exact DTO models, typed Books/Authors/Categories services, API configuration, auth, interceptor, route guard and notifications.
- `src/app/features/books`: catalog/admin list, URL-synchronized filters, card, details and reusable create/edit form.
- `src/app/features/admin`: responsive sidebar layout and shared Authors/Categories table, form and detail dialogs.
- `src/app/features/auth` and `public`: login and public layout.
- `src/app/shared`: image display, loading/error/empty states, pagination, native accessible confirmation dialog and validation.
- `src/styles`: reusable design tokens; `src/styles.scss`: responsive layout and components.

Major pages are lazy loaded. HTTP calls stay in services. Reactive forms validate backend constraints; signals represent view state. RxJS switchMap cancels outdated list requests. Native dialogs trap focus and support Escape; deletion waits for server confirmation.

## Frontend routes

| Route                   | Feature                                                |
| ----------------------- | ------------------------------------------------------ |
| `/`                     | Public catalog, combined filters and server pagination |
| `/books/:id`            | Public book details                                    |
| `/admin/login`          | Admin login                                            |
| `/admin`                | Redirect to `/admin/books`                             |
| `/admin/books`          | Protected books management                             |
| `/admin/books/new`      | Create book                                            |
| `/admin/books/:id`      | Admin book details                                     |
| `/admin/books/:id/edit` | Edit metadata and optionally replace cover             |
| `/admin/authors`        | Authors CRUD and detail dialog                         |
| `/admin/categories`     | Categories CRUD and detail dialog                      |
| Other paths             | Not found page                                         |

Catalog filter values and page are represented in URL parameters, preserving browser history and Back to Books navigation state when using browser back. The details Back to Books link returns to the unfiltered list.

## Real API map

Verified against controllers, DTOs, validators, `GeneralResult`, `PagedResult`, auth and image services under `D:/LibrarySystem`, and the downloaded live schema in `swagger.json`.

| Feature                       | Method and API path                                                               | Request                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Login                         | `POST /api/Auth/login`                                                            | JSON `{email,password}`                                                 |
| Books                         | `GET /api/books`                                                                  | `authorId`, `categoryId`, `publicationYear`, `pageNumber`, `pageSize`   |
| Book details                  | `GET /api/books/{id}`                                                             | integer ID                                                              |
| Create book                   | `POST /api/books`                                                                 | multipart `Title`, `PublicationYear`, `AuthorId`, `CategoryId`, `Image` |
| Edit metadata                 | `PUT /api/books/{id}`                                                             | JSON `{title,publicationYear,authorId,categoryId}`                      |
| Replace cover                 | `PUT /api/books/{id}/image`                                                       | multipart `Image`                                                       |
| Delete book                   | `DELETE /api/books/{id}`                                                          | backend-controlled deletion                                             |
| Author filter                 | `GET /api/books/filters/authors`                                                  | returns all active options                                              |
| Category filter               | `GET /api/books/filters/categories`                                               | returns all active options                                              |
| Year filter                   | `GET /api/books/filters/years`                                                    | returns distinct active years                                           |
| Authors list/details          | `GET /api/authors`, `GET /api/authors/{id}`                                       | list uses `pageNumber`, `pageSize`                                      |
| Authors create/edit/delete    | `POST /api/authors`, `PUT /api/authors/{id}`, `DELETE /api/authors/{id}`          | create/edit JSON `{name}`                                               |
| Categories list/details       | `GET /api/categories`, `GET /api/categories/{id}`                                 | list uses `pageNumber`, `pageSize`                                      |
| Categories create/edit/delete | `POST /api/categories`, `PUT /api/categories/{id}`, `DELETE /api/categories/{id}` | create/edit JSON `{name}`                                               |

Responses wrap data as `{success,message,data}`. Paginated data is `{items,pageNumber,pageSize,totalCount,totalPages}`. Login data is `{success,message,token,userData}`. Failed wrappers and server validation messages are surfaced. Author/category deletion restrictions are enforced by the backend.

Books have one author and one category, title (200 characters maximum), publication year (1 through the current UTC year), cover URL and audit fields in details. Authors allow 150-character names, categories 100. Create requires a cover; replacement is a separate optional edit request. Allowed image extensions are JPG/JPEG/PNG/WEBP and the actual validator limit is **3 MB**, despite its 5 MB error text. If metadata succeeds but image replacement fails, the form explicitly reports the partial success and allows retry.

## Verification and limitations

See `docs/verification.md` for results. No authenticated live mutations were performed: administrator credentials were not supplied. Automated HTTP tests verify request contracts without changing production records.

The backend does not provide descriptions, ISBN, archive status, multiple categories, refresh tokens or registration; these features are omitted. Existing public DTOs include audit fields, which are shown where applicable. No backend business logic was changed.
