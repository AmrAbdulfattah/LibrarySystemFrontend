import { inject, Injectable, InjectionToken } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { map } from "rxjs";
import { Book, BookForm, Filters, Login, Named, Page, Result } from "./models";
export const API_BASE_URL = new InjectionToken<string>("API_BASE_URL");
export const unwrap = <T>(result: Result<T>): T => {
  if (!result.success) throw new Error(result.message);
  return result.data;
};
export function errorMessage(error: unknown): string {
  const e = error as {
    status?: number;
    message?: string;
    error?: {
      message?: string;
      title?: string;
      errors?: Record<string, unknown[]>;
    };
  };
  if (e.status === 0)
    return "Cannot connect to the library. Check your connection and try again.";
  if (e.status === 403)
    return "Your account does not have permission to perform this action.";
  const details = e.error?.errors
    ? Object.values(e.error.errors)
        .flat()
        .map((x) =>
          typeof x === "string"
            ? x
            : (x as { message?: string; description?: string }).message ||
              (x as { description?: string }).description ||
              "",
        )
        .filter(Boolean)
        .join(" ")
    : "";
  return (
    details ||
    e.error?.message ||
    e.error?.title ||
    e.message ||
    "Something went wrong. Please try again."
  );
}
@Injectable({ providedIn: "root" })
export class BooksService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL) + "/books";
  readonly options = this.http
    .get<Result<Named[]>>(this.base + "/filters/authors")
    .pipe(map(unwrap));
  readonly categories = this.http
    .get<Result<Named[]>>(this.base + "/filters/categories")
    .pipe(map(unwrap));
  readonly years = this.http
    .get<Result<number[]>>(this.base + "/filters/years")
    .pipe(map(unwrap));
  list(filters: Filters = {}, pageNumber = 1, pageSize = 12) {
    let params = new HttpParams()
      .set("pageNumber", pageNumber)
      .set("pageSize", pageSize);
    for (const [key, value] of Object.entries(filters))
      if (value) params = params.set(key, value);
    return this.http
      .get<Result<Page<Book>>>(this.base, { params })
      .pipe(map(unwrap));
  }
  get(id: number) {
    return this.http.get<Result<Book>>(`${this.base}/${id}`).pipe(map(unwrap));
  }
  create(value: BookForm, image: File) {
    const body = new FormData();
    for (const [key, v] of Object.entries(value))
      body.set(key[0].toUpperCase() + key.slice(1), String(v));
    body.set("Image", image);
    return this.http.post<Result<Book>>(this.base, body).pipe(map(unwrap));
  }
  update(id: number, value: BookForm) {
    return this.http
      .put<Result<Book>>(`${this.base}/${id}`, value)
      .pipe(map(unwrap));
  }
  image(id: number, image: File) {
    const body = new FormData();
    body.set("Image", image);
    return this.http
      .put<Result<Book>>(`${this.base}/${id}/image`, body)
      .pipe(map(unwrap));
  }
  delete(id: number) {
    return this.http
      .delete<Result<void>>(`${this.base}/${id}`)
      .pipe(map(unwrap));
  }
  imageUrl(path: string) {
    try {
      const url = new URL(path, injectOrigin(this.base));
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }
}
function injectOrigin(base: string) {
  return new URL(base).origin;
}
export class NamedService {
  private http = inject(HttpClient);
  private base: string;
  constructor(kind: string) {
    this.base = inject(API_BASE_URL) + "/" + kind;
  }
  list(pageNumber = 1) {
    return this.http
      .get<Result<Page<Named>>>(this.base, {
        params: new HttpParams()
          .set("pageNumber", pageNumber)
          .set("pageSize", 10),
      })
      .pipe(map(unwrap));
  }
  get(id: number) {
    return this.http.get<Result<Named>>(`${this.base}/${id}`).pipe(map(unwrap));
  }
  save(name: string, id?: number) {
    return (
      id
        ? this.http.put<Result<Named>>(`${this.base}/${id}`, { name })
        : this.http.post<Result<Named>>(this.base, { name })
    ).pipe(map(unwrap));
  }
  delete(id: number) {
    return this.http
      .delete<Result<void>>(`${this.base}/${id}`)
      .pipe(map(unwrap));
  }
}
@Injectable({ providedIn: "root" })
export class AuthorsService extends NamedService {
  constructor() {
    super("authors");
  }
}
@Injectable({ providedIn: "root" })
export class CategoriesService extends NamedService {
  constructor() {
    super("categories");
  }
}
