import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { API_BASE_URL } from "../../core/api";
import { BookList } from "./list";
import { NamedList } from "../admin/named-list";

const combinations = [
  {},
  { authorId: "2" },
  { categoryId: "3" },
  { publicationYear: "2020" },
  { authorId: "2", categoryId: "3" },
  { authorId: "2", publicationYear: "2020" },
  { categoryId: "3", publicationYear: "2020" },
  { authorId: "2", categoryId: "3", publicationYear: "2020" },
];
beforeEach(() => TestBed.resetTestingModule());
const response = (pageNumber: number, totalPages = 3) => ({
  success: true,
  data: {
    items: [],
    pageNumber,
    pageSize: 12,
    totalCount: totalPages * 12,
    totalPages,
  },
});
function setup(
  data: Record<string, unknown>,
  initial: Record<string, string> = {},
) {
  const params = new BehaviorSubject(convertToParamMap(initial));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: "https://library.test/api" },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data }, queryParamMap: params },
      },
    ],
  });
  vi.spyOn(TestBed.inject(Router), "navigate").mockImplementation(
    (_, extras) => {
      params.next(convertToParamMap(extras?.queryParams ?? {}));
      return Promise.resolve(true);
    },
  );
  return { params, http: TestBed.inject(HttpTestingController) };
}
function options(http: HttpTestingController) {
  for (const kind of ["authors", "categories", "years"])
    http
      .expectOne("https://library.test/api/books/filters/" + kind)
      .flush({ success: true, data: [] });
}
describe.each([false, true])("Books server pagination (admin=%s)", (admin) => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it.each(combinations)(
    "preserves filters through next/previous and resets on change: %j",
    (filters) => {
      const { http } = setup({ admin }, { ...filters, page: "2" } as Record<
        string,
        string
      >);
      const f = TestBed.createComponent(BookList);
      options(http);
      const initial = http.expectOne((r) => r.url.endsWith("/books"));
      expect(initial.request.params.get("pageNumber")).toBe("2");
      for (const [key, value] of Object.entries(filters))
        expect(initial.request.params.get(key)).toBe(value);
      initial.flush(response(2));
      f.componentInstance.navigate(3);
      const next = http.expectOne((r) => r.url.endsWith("/books"));
      expect(next.request.params.get("pageNumber")).toBe("3");
      expect(next.request.params.get("pageSize")).toBe(admin ? "10" : "12");
      for (const [key, value] of Object.entries(filters))
        expect(next.request.params.get(key)).toBe(value);
      next.flush(response(3));
      f.componentInstance.navigate(2);
      http
        .expectOne((r) => r.params.get("pageNumber") === "2")
        .flush(response(2));
      f.componentInstance.form.controls.authorId.setValue("9");
      const changed = http.expectOne((r) => r.url.endsWith("/books"));
      expect(changed.request.params.get("pageNumber")).toBe("1");
      expect(changed.request.params.get("authorId")).toBe("9");
      for (const [key, value] of Object.entries(filters))
        if (key !== "authorId")
          expect(changed.request.params.get(key)).toBe(value);
      changed.flush(response(1));
      f.destroy();
    },
  );
  it("does not refetch duplicate route state and recovers from out-of-range pages", () => {
    const { http, params } = setup({ admin }, { page: "2" });
    const f = TestBed.createComponent(BookList);
    options(http);
    http.expectOne((r) => r.url.endsWith("/books")).flush(response(2));
    params.next(convertToParamMap({ page: "2" }));
    http.expectNone((r) => r.url.endsWith("/books"));
    params.next(convertToParamMap({ page: "99" }));
    http
      .expectOne((r) => r.params.get("pageNumber") === "99")
      .flush(response(99));
    http
      .expectOne((r) => r.params.get("pageNumber") === "3")
      .flush(response(3));
    expect(f.componentInstance.page()).toBe(3);
    f.destroy();
  });
  it("normalizes malformed pages and permits retry after API errors", () => {
    const { http } = setup({ admin }, { page: "1.5" });
    const f = TestBed.createComponent(BookList);
    options(http);
    http
      .expectOne((r) => r.params.get("pageNumber") === "1")
      .flush(
        { message: "Temporarily unavailable" },
        { status: 500, statusText: "Error" },
      );
    expect(f.componentInstance.loading()).toBe(false);
    expect(f.componentInstance.error()).toContain("Temporarily unavailable");
    f.componentInstance.reload();
    http
      .expectOne((r) => r.params.get("pageNumber") === "1")
      .flush(response(1, 0));
    expect(f.componentInstance.data()?.totalCount).toBe(0);
    f.destroy();
  });
});
describe.each(["authors", "categories"])("%s management pagination", (kind) => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it("requests exact pages, cancels retries on navigation, and suppresses duplicates", () => {
    const { http, params } = setup({ kind }, { page: "2" });
    const f = TestBed.createComponent(NamedList);
    http
      .expectOne(
        (r) =>
          r.url.endsWith("/" + kind) &&
          r.params.get("pageNumber") === "2" &&
          r.params.get("pageSize") === "10",
      )
      .flush(response(2));
    f.componentInstance.reload();
    const retry = http.expectOne((r) => r.url.endsWith("/" + kind));
    f.componentInstance.navigate(3);
    expect(retry.cancelled).toBe(true);
    http
      .expectOne((r) => r.params.get("pageNumber") === "3")
      .flush(response(3));
    params.next(convertToParamMap({ page: "3" }));
    http.expectNone((r) => r.url.endsWith("/" + kind));
    f.componentInstance.navigate(2);
    http
      .expectOne((r) => r.params.get("pageNumber") === "2")
      .flush(response(2));
    f.destroy();
  });
  it("recovers empty/out-of-range URLs and shows API errors without faking data", () => {
    const { http } = setup({ kind }, { page: "99" });
    const f = TestBed.createComponent(NamedList);
    http
      .expectOne((r) => r.params.get("pageNumber") === "99")
      .flush(response(99, 0));
    http
      .expectOne((r) => r.params.get("pageNumber") === "1")
      .flush(response(1, 0));
    expect(f.componentInstance.data()?.items).toEqual([]);
    f.componentInstance.reload();
    http
      .expectOne((r) => r.url.endsWith("/" + kind))
      .flush({ message: "Unavailable" }, { status: 500, statusText: "Error" });
    expect(f.componentInstance.error()).toContain("Unavailable");
    f.destroy();
  });
});
