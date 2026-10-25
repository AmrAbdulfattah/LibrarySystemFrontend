import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { Router, provideRouter } from "@angular/router";
import { AuthService, adminGuard, authInterceptor, isAdminToken } from "./auth";
import { API_BASE_URL } from "./api";
import { HttpClient } from "@angular/common/http";
const token = (role = "Admin", exp = Math.floor(Date.now() / 1000) + 3600) =>
  "e30." + btoa(JSON.stringify({ role, exp })) + ".signature";
describe("Admin authentication", () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: "https://library.test/api" },
      ],
    });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    sessionStorage.clear();
  });
  it("rejects expired, non-admin, and malformed tokens", () => {
    expect(isAdminToken(token("Admin", 1))).toBe(false);
    expect(isAdminToken(token("Reader"))).toBe(false);
    expect(isAdminToken("bad")).toBe(false);
    expect(isAdminToken(token())).toBe(true);
  });
  it("redirects unauthenticated admin navigation while preserving destination", () => {
    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: "/admin/books" } as never),
    );
    expect(TestBed.inject(Router).serializeUrl(result as never)).toBe(
      "/admin/login?returnUrl=%2Fadmin%2Fbooks",
    );
  });
  it("uses real login payload and stores only the session token", () => {
    TestBed.inject(AuthService)
      .login("admin@example.com", "password")
      .subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(
      "https://library.test/api/Auth/login",
    );
    expect(req.request.body).toEqual({
      email: "admin@example.com",
      password: "password",
    });
    req.flush({
      success: true,
      data: { token: token(), userData: { role: "Admin" } },
    });
    expect(TestBed.inject(AuthService).valid()).toBe(true);
    expect(sessionStorage.getItem("library.token")).toBe(token());
  });
  it("never sends the bearer token to unrelated origins", () => {
    TestBed.inject(AuthService).token.set(token());
    const client = TestBed.inject(HttpClient);
    client.get("https://other.test/api/books").subscribe();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne("https://other.test/api/books");
    expect(req.request.headers.has("Authorization")).toBe(false);
    req.flush({});
    client.get("https://library.test/api/books").subscribe();
    const own = http.expectOne("https://library.test/api/books");
    expect(own.request.headers.get("Authorization")).toBe("Bearer " + token());
    own.flush({});
  });
});
