import { DOCUMENT } from "@angular/common";
import { DestroyRef, inject, Injectable, signal } from "@angular/core";
import { HttpClient, HttpInterceptorFn } from "@angular/common/http";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, tap, throwError } from "rxjs";
import { API_BASE_URL, unwrap } from "./api";
import { Login, Result } from "./models";
const TOKEN_KEY = "library.token";
/** Convenience role/lifetime checks only. The API validates signature, issuer and audience. */
function adminTokenExpiry(token: string | null): number {
  try {
    if (!token) return 0;
    const parts = token.split(".");
    if (parts.length !== 3 || parts.some((part) => !part)) return 0;
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")),
    );
    const role =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      payload.role;
    if (!(Array.isArray(role) ? role.includes("Admin") : role === "Admin"))
      return 0;
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp))
      return 0;
    const expiry = payload.exp * 1000;
    return expiry > 0 && expiry <= Number.MAX_SAFE_INTEGER ? expiry : 0;
  } catch {
    return 0;
  }
}
export function isAdminToken(token: string | null): boolean {
  return adminTokenExpiry(token) > Date.now();
}
@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private view = this.document.defaultView;
  private tokenState = signal<string | null>(null);
  readonly token = this.tokenState.asReadonly();
  private expiryTimer?: ReturnType<typeof setTimeout>;
  constructor() {
    // Never revive a legacy tab-local token after a persistent-session logout.
    this.clearLegacyStorage();
    this.synchronize();
    const storage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === null) {
        this.synchronize();
        this.redirectIfRequired();
      }
    };
    const resume = () => {
      this.synchronize();
      this.redirectIfRequired();
    };
    this.view?.addEventListener("storage", storage);
    this.view?.addEventListener("focus", resume);
    this.document.addEventListener("visibilitychange", resume);
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.expiryTimer);
      this.view?.removeEventListener("storage", storage);
      this.view?.removeEventListener("focus", resume);
      this.document.removeEventListener("visibilitychange", resume);
    });
  }
  private readStored(): string | null {
    try {
      return this.view?.localStorage.getItem(TOKEN_KEY) ?? null;
    } catch {
      return null;
    }
  }
  private clearLegacyStorage() {
    try {
      this.view?.sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* Storage may be disabled. */
    }
  }
  private clearStored() {
    try {
      this.view?.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* In-memory auth is still cleared. */
    }
    this.clearLegacyStorage();
  }
  private adopt(token: string | null) {
    clearTimeout(this.expiryTimer);
    this.tokenState.set(token);
    if (token) {
      const remaining = adminTokenExpiry(token) - Date.now();
      this.expiryTimer = setTimeout(
        () => {
          this.expiryTimer = undefined;
          this.synchronize();
          this.redirectIfRequired();
        },
        Math.max(0, Math.min(remaining, 2147483647)),
      );
    }
  }
  private synchronize() {
    const stored = this.readStored();
    if (!isAdminToken(stored)) {
      if (stored && this.readStored() === stored) this.clearStored();
      this.adopt(null);
      return;
    }
    if (stored !== this.tokenState() || !this.expiryTimer) this.adopt(stored);
  }
  private redirectIfRequired() {
    if (
      !this.tokenState() &&
      this.router.url.startsWith("/admin") &&
      !this.router.url.startsWith("/admin/login")
    )
      void this.router.navigate(["/admin/login"], {
        queryParams: { returnUrl: this.router.url },
      });
  }
  login(email: string, password: string) {
    return this.http
      .post<Result<Login>>(this.base + "/Auth/login", { email, password })
      .pipe(
        map(unwrap),
        tap((data) => {
          if (!isAdminToken(data.token))
            throw new Error(
              "An administrator account with a valid token is required.",
            );
          try {
            if (!this.view) throw new Error();
            this.view.localStorage.setItem(TOKEN_KEY, data.token);
          } catch {
            throw new Error(
              "Cannot persist your session. Enable storage for this website and try again.",
            );
          }
          this.clearLegacyStorage();
          this.adopt(data.token);
        }),
      );
  }
  valid() {
    this.synchronize();
    return this.tokenState() !== null;
  }
  logout() {
    this.clearStored();
    this.adopt(null);
    void this.router.navigate(["/admin/login"]);
  }
  unauthorized(rejectedToken: string) {
    this.synchronize();
    if (this.tokenState() === rejectedToken) this.logout();
    else this.redirectIfRequired();
  }
}
export const adminGuard: CanActivateFn = (_, state) =>
  inject(AuthService).valid() ||
  inject(Router).createUrlTree(["/admin/login"], {
    queryParams: { returnUrl: state.url },
  });
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService),
    base = inject(API_BASE_URL);
  const scoped = req.url.startsWith(base + "/");
  const token = scoped && auth.valid() ? auth.token() : null;
  if (token)
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(req).pipe(
    catchError((error) => {
      if (scoped && error.status === 401 && token) auth.unauthorized(token);
      return throwError(() => error);
    }),
  );
};
