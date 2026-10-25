import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Router, provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { API_BASE_URL } from "./core/api";
import { routes } from "./app.routes";
describe("Application routes", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: "https://library.test/api" },
      ],
    });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it("protects every admin feature route", async () => {
    const harness = await RouterTestingHarness.create();
    for (const path of [
      "/admin",
      "/admin/books",
      "/admin/books/new",
      "/admin/books/7",
      "/admin/books/7/edit",
      "/admin/authors",
      "/admin/categories",
    ]) {
      await harness.navigateByUrl(path);
      expect(TestBed.inject(Router).url).toContain("/admin/login");
      expect(harness.routeNativeElement?.textContent).toContain("Welcome back");
    }
  });
  it("loads public catalog and details without a session", async () => {
    const harness = await RouterTestingHarness.create("/");
    const http = TestBed.inject(HttpTestingController);
    for (const option of ["authors", "categories", "years"])
      http
        .expectOne("https://library.test/api/books/filters/" + option)
        .flush({ success: true, data: [] });
    http
      .expectOne((r) => r.url.endsWith("/books"))
      .flush({
        success: true,
        data: {
          items: [],
          pageNumber: 1,
          pageSize: 12,
          totalCount: 0,
          totalPages: 0,
        },
      });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain("No books found");
    await harness.navigateByUrl("/books/7");
    http.expectOne("https://library.test/api/books/7").flush({
      success: true,
      data: {
        id: 7,
        title: "Public title",
        authorName: "Author",
        categoryName: "Category",
        publicationYear: 1929,
        imageUrl: "",
      },
    });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain("Public title");
    expect(TestBed.inject(Router).url).toBe("/books/7");
  });
});
