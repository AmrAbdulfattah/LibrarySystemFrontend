import { TestBed } from "@angular/core/testing";
import { ApplicationInitStatus } from "@angular/core";
import { appConfig } from "../app.config";
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { Router, provideRouter } from "@angular/router";
import { AuthService, adminGuard, authInterceptor, isAdminToken } from "./auth";
import { API_BASE_URL } from "./api";
const key = "library.token";
const jwt = (seconds = 3600, role = "Admin") =>
  "e30." +
  btoa(JSON.stringify({ role, exp: Math.floor(Date.now() / 1000) + seconds })) +
  ".test-signature";
function configure() {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: "https://library.test/api" },
    ],
  });
  vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
}
describe("Persistent admin sessions", () => {
  it("expires exactly at exp, not a fixed number of hours after initialization", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
    localStorage.setItem(key, jwt(5));
    const auth = TestBed.inject(AuthService);
    vi.advanceTimersByTime(4999);
    expect(auth.valid()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(auth.token()).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });
  it("does not authenticate when persistent storage cannot save the login", () => {
    const auth = TestBed.inject(AuthService);
    const blocked = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new DOMException("Blocked", "SecurityError");
      });
    let message = "";
    auth
      .login("admin@example.com", "test-password")
      .subscribe({ error: (e) => (message = e.message) });
    TestBed.inject(HttpTestingController)
      .expectOne("https://library.test/api/Auth/login")
      .flush({
        success: true,
        data: { token: jwt(), userData: { role: "Admin" } },
      });
    expect(message).toContain("Cannot persist");
    expect(auth.token()).toBeNull();
    blocked.mockRestore();
  });
  it("runs auth restoration in the actual app initializer before protected routing", async () => {
    TestBed.resetTestingModule();
    localStorage.setItem(key, jwt(-1));
    TestBed.configureTestingModule({
      providers: [
        ...appConfig("https://library.test/api").providers,
        provideHttpClientTesting(),
      ],
    });
    const initialization = TestBed.inject(ApplicationInitStatus);
    await initialization.donePromise;
    expect(localStorage.getItem(key)).toBeNull();
    expect(TestBed.inject(AuthService).valid()).toBe(false);
  });
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    configure();
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
    localStorage.clear();
    sessionStorage.clear();
    vi.useRealTimers();
  });
  it("restores a valid persisted token synchronously before guards and across a fresh app instance", () => {
    const saved = jwt();
    localStorage.setItem(key, saved);
    const auth = TestBed.inject(AuthService);
    expect(auth.valid()).toBe(true);
    expect(
      TestBed.runInInjectionContext(() =>
        adminGuard({} as never, { url: "/admin/books" } as never),
      ),
    ).toBe(true);
    TestBed.resetTestingModule();
    configure();
    expect(TestBed.inject(AuthService).token()).toBe(saved);
    expect(TestBed.inject(AuthService).valid()).toBe(true);
  });
  it("persists only the JWT after successful login and never stores a password", () => {
    const auth = TestBed.inject(AuthService);
    const saved = jwt();
    auth.login("admin@example.com", "test-password").subscribe();
    TestBed.inject(HttpTestingController)
      .expectOne("https://library.test/api/Auth/login")
      .flush({
        success: true,
        data: { token: saved, userData: { role: "Admin" } },
      });
    expect(localStorage.getItem(key)).toBe(saved);
    expect(sessionStorage.getItem(key)).toBeNull();
    expect(Object.values(localStorage).join(" ")).not.toContain(
      "test-password",
    );
  });
  it("clears expired/malformed tokens instead of accepting mere storage presence", () => {
    localStorage.setItem(key, jwt(-1));
    expect(TestBed.inject(AuthService).valid()).toBe(false);
    expect(localStorage.getItem(key)).toBeNull();
    expect(
      isAdminToken(
        "e30." +
          btoa(JSON.stringify({ role: "Admin", exp: "Infinity" })) +
          ".signature",
      ),
    ).toBe(false);
  });
  it("expires at the actual exp timestamp and redirects a protected page without extending lifetime", () => {
    vi.useFakeTimers();
    localStorage.setItem(key, jwt(5));
    const router = TestBed.inject(Router);
    vi.spyOn(router, "url", "get").mockReturnValue("/admin/books");
    const auth = TestBed.inject(AuthService);
    expect(auth.valid()).toBe(true);
    vi.advanceTimersByTime(6000);
    expect(auth.token()).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(
      ["/admin/login"],
      expect.anything(),
    );
  });
  it("synchronizes logout and a later login from other tabs", () => {
    localStorage.setItem(key, jwt());
    const router = TestBed.inject(Router);
    vi.spyOn(router, "url", "get").mockReturnValue("/admin/categories");
    const auth = TestBed.inject(AuthService);
    localStorage.removeItem(key);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: null,
        storageArea: localStorage,
      }),
    );
    expect(auth.token()).toBeNull();
    expect(router.navigate).toHaveBeenCalled();
    const replacement = jwt(120);
    localStorage.setItem(key, replacement);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: replacement,
        storageArea: localStorage,
      }),
    );
    expect(auth.token()).toBe(replacement);
    expect(auth.valid()).toBe(true);
  });
  it("manual logout clears both persistent and legacy state and guards reject reopening", () => {
    localStorage.setItem(key, jwt());
    sessionStorage.setItem(key, jwt());
    const auth = TestBed.inject(AuthService);
    auth.logout();
    expect(localStorage.getItem(key)).toBeNull();
    expect(sessionStorage.getItem(key)).toBeNull();
    expect(auth.valid()).toBe(false);
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith([
      "/admin/login",
    ]);
  });
  it("uses restored tokens only for the API and clears the session after a matching 401", () => {
    const saved = jwt();
    localStorage.setItem(key, saved);
    const auth = TestBed.inject(AuthService);
    const client = TestBed.inject(HttpClient);
    client.get("https://library.test/api/books").subscribe({ error: () => {} });
    const req = TestBed.inject(HttpTestingController).expectOne(
      "https://library.test/api/books",
    );
    expect(req.request.headers.get("Authorization")).toBe("Bearer " + saved);
    req.flush({}, { status: 401, statusText: "Unauthorized" });
    expect(auth.token()).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });
  it("does not clear a newer login when an old request returns 401", () => {
    const original = jwt();
    localStorage.setItem(key, original);
    const auth = TestBed.inject(AuthService);
    TestBed.inject(HttpClient)
      .get("https://library.test/api/books")
      .subscribe({ error: () => {} });
    const req = TestBed.inject(HttpTestingController).expectOne(
      "https://library.test/api/books",
    );
    const replacement = jwt(7200);
    localStorage.setItem(key, replacement);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: replacement,
        storageArea: localStorage,
      }),
    );
    req.flush({}, { status: 401, statusText: "Unauthorized" });
    expect(auth.token()).toBe(replacement);
    expect(localStorage.getItem(key)).toBe(replacement);
  });
  it("rechecks a suspended tab on focus and never attaches an expired token", () => {
    vi.useFakeTimers();
    localStorage.setItem(key, jwt(5));
    const auth = TestBed.inject(AuthService);
    vi.setSystemTime(Date.now() + 10000);
    window.dispatchEvent(new Event("focus"));
    TestBed.inject(HttpClient)
      .get("https://library.test/api/books")
      .subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(
      "https://library.test/api/books",
    );
    expect(req.request.headers.has("Authorization")).toBe(false);
    req.flush({});
    expect(auth.token()).toBeNull();
  });
  it("reschedules platform-limited timers without extending the JWT expiration", () => {
    vi.useFakeTimers();
    localStorage.setItem(key, jwt(2147544));
    const auth = TestBed.inject(AuthService);
    vi.advanceTimersByTime(2147483647);
    expect(auth.token()).not.toBeNull();
    vi.advanceTimersByTime(70000);
    expect(auth.token()).toBeNull();
  });
});
