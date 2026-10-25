import { inject, Injectable, signal } from "@angular/core";
import { HttpClient, HttpInterceptorFn } from "@angular/common/http";
import { CanActivateFn, Router } from "@angular/router";
import { catchError, map, tap, throwError } from "rxjs";
import { API_BASE_URL, unwrap } from "./api";
import { Login, Result } from "./models";
export function isAdminToken(token: string | null): boolean {
  try {
    if (!token) return false;
    const raw = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(raw));
    const role =
      p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      p.role;
    return (
      Number(p.exp) * 1000 > Date.now() &&
      (Array.isArray(role) ? role.includes("Admin") : role === "Admin")
    );
  } catch {
    return false;
  }
}
@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private base = inject(API_BASE_URL);
  private router = inject(Router);
  readonly token = signal(sessionStorage.getItem("library.token"));
  login(email: string, password: string) {
    return this.http
      .post<Result<Login>>(this.base + "/Auth/login", { email, password })
      .pipe(
        map(unwrap),
        tap((data) => {
          if (!isAdminToken(data.token))
            throw new Error("An administrator account is required.");
          sessionStorage.setItem("library.token", data.token);
          this.token.set(data.token);
        }),
      );
  }
  valid() {
    return isAdminToken(this.token());
  }
  logout() {
    sessionStorage.removeItem("library.token");
    this.token.set(null);
    void this.router.navigate(["/admin/login"]);
  }
}
export const adminGuard: CanActivateFn = (_, state) =>
  inject(AuthService).valid() ||
  inject(Router).createUrlTree(["/admin/login"], {
    queryParams: { returnUrl: state.url },
  });
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const base = inject(API_BASE_URL);
  const scoped = req.url.startsWith(base + "/");
  const token = auth.token();
  if (scoped && token && auth.valid())
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(req).pipe(
    catchError((err) => {
      if (scoped && err.status === 401 && token) auth.logout();
      return throwError(() => err);
    }),
  );
};
