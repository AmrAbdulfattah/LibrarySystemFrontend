import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from "@angular/router";
import { API_BASE_URL } from "../../core/api";
import { BookFormPage } from "./form";
describe("Book form", () => {
  let http: HttpTestingController;
  function setup(id?: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: "https://library.test/api" },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(id ? { id } : {}) },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(BookFormPage);
    http
      .expectOne((r) => r.url.endsWith("/authors"))
      .flush({
        success: true,
        data: {
          items: [{ id: 2, name: "Author" }],
          pageNumber: 1,
          totalPages: 1,
        },
      });
    http
      .expectOne((r) => r.url.endsWith("/categories"))
      .flush({
        success: true,
        data: {
          items: [{ id: 3, name: "Category" }],
          pageNumber: 1,
          totalPages: 1,
        },
      });
    if (id)
      http.expectOne("https://library.test/api/books/" + id).flush({
        success: true,
        data: {
          id: Number(id),
          title: "A book",
          publicationYear: 2020,
          authorId: 2,
          categoryId: 3,
          imageUrl: "/images/a.jpg",
        },
      });
    return fixture;
  }
  afterEach(() => http.verify());
  it.each([undefined, "7"])(
    "returns to the books list only after a confirmed save (id=%s)",
    (id) => {
      const f = setup(id);
      const c = f.componentInstance;
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, "navigate").mockResolvedValue(true);
      c.form.setValue({
        title: "A book",
        publicationYear: 2020,
        authorId: 2,
        categoryId: 3,
      });
      if (!id) c.file = new File(["cover"], "cover.jpg");
      c.save();
      c.save();
      expect(navigate).not.toHaveBeenCalled();
      const req = http.expectOne(
        "https://library.test/api/books" + (id ? "/7" : ""),
      );
      req.flush({ success: true, data: { id: 7 } });
      expect(navigate).toHaveBeenCalledWith(["/admin/books"]);
      f.destroy();
    },
  );
  it.each([undefined, "7"])(
    "retains the form on failed save and permits retry (id=%s)",
    (id) => {
      const f = setup(id);
      const c = f.componentInstance;
      const navigate = vi
        .spyOn(TestBed.inject(Router), "navigate")
        .mockResolvedValue(true);
      c.form.setValue({
        title: "A book",
        publicationYear: 2020,
        authorId: 2,
        categoryId: 3,
      });
      if (!id) c.file = new File(["cover"], "cover.jpg");
      c.save();
      http
        .expectOne("https://library.test/api/books" + (id ? "/7" : ""))
        .flush(
          { message: "Cannot save" },
          { status: 400, statusText: "Bad Request" },
        );
      expect(navigate).not.toHaveBeenCalled();
      expect(c.busy()).toBe(false);
      expect(c.error()).toContain("Cannot save");
      f.destroy();
    },
  );
  it("submits numeric relationship IDs selected through the reusable controls", () => {
    const fixture = setup();
    const c = fixture.componentInstance;
    vi.spyOn(TestBed.inject(Router), "navigate").mockResolvedValue(true);
    c.form.patchValue({ title: "A book", publicationYear: 2020 });
    c.authors.set(
      Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        name: `كاتب ${i + 1}`,
      })),
    );
    c.categories.set(
      Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        name: `تصنيف ${i + 1}`,
      })),
    );
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    for (const label of ["Author", "Category"]) {
      root
        .querySelector<HTMLButtonElement>(
          `button[role="combobox"][aria-label="${label}"]`,
        )!
        .click();
      fixture.detectChanges();
      const options = root.querySelectorAll<HTMLElement>(
        '.select-panel:not([hidden]) [role="option"]',
      );
      options[40].click();
      fixture.detectChanges();
    }
    expect(c.form.controls.authorId.value).toBe(40);
    expect(c.form.controls.categoryId.value).toBe(40);
    c.file = new File(["cover"], "cover.jpg");
    c.save();
    const request = http.expectOne("https://library.test/api/books");
    expect(request.request.body.get("AuthorId")).toBe("40");
    expect(request.request.body.get("CategoryId")).toBe("40");
    request.flush({ success: true, data: { id: 99 } });
    fixture.destroy();
  });
  it("does not submit invalid or imageless create forms", () => {
    const fixture = setup();
    const c = fixture.componentInstance;
    c.save();
    http.expectNone((r) => r.url.endsWith("/books"));
    c.form.setValue({
      title: "A book",
      publicationYear: 2020,
      authorId: 2,
      categoryId: 3,
    });
    c.save();
    http.expectNone((r) => r.url.endsWith("/books"));
    expect(c.imageIssue()).toContain("required");
    fixture.destroy();
  });
  it("loads all pages of relationship options", () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: "https://library.test/api" },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(BookFormPage);
    http
      .expectOne((r) => r.url.endsWith("/authors"))
      .flush({
        success: true,
        data: {
          items: [{ id: 1, name: "First" }],
          pageNumber: 1,
          totalPages: 2,
        },
      });
    http
      .expectOne(
        (r) => r.url.endsWith("/authors") && r.params.get("pageNumber") === "2",
      )
      .flush({
        success: true,
        data: {
          items: [{ id: 2, name: "Second" }],
          pageNumber: 2,
          totalPages: 2,
        },
      });
    http
      .expectOne((r) => r.url.endsWith("/categories"))
      .flush({
        success: true,
        data: {
          items: [{ id: 11, name: "تصنيف أول" }],
          pageNumber: 1,
          totalPages: 2,
        },
      });
    http
      .expectOne(
        (r) =>
          r.url.endsWith("/categories") && r.params.get("pageNumber") === "2",
      )
      .flush({
        success: true,
        data: {
          items: [{ id: 12, name: "تصنيف أخير" }],
          pageNumber: 2,
          totalPages: 2,
        },
      });
    expect(fixture.componentInstance.categories().map((c) => c.id)).toEqual([
      11, 12,
    ]);
    expect(fixture.componentInstance.authors().map((a) => a.id)).toEqual([
      1, 2,
    ]);
    fixture.destroy();
  });
  it("reports partial success when metadata saves but image replacement fails", () => {
    const fixture = setup("7");
    const c = fixture.componentInstance;
    c.file = new File(["cover"], "a.png");
    c.save();
    const update = http.expectOne("https://library.test/api/books/7");
    expect(update.request.method).toBe("PUT");
    expect(update.request.body).toEqual({
      title: "A book",
      publicationYear: 2020,
      authorId: 2,
      categoryId: 3,
    });
    update.flush({ success: true, data: { id: 7 } });
    http
      .expectOne("https://library.test/api/books/7/image")
      .flush(
        { message: "Upload failed" },
        { status: 500, statusText: "Server Error" },
      );
    expect(c.error()).toContain("details were saved");
    expect(c.busy()).toBe(false);
    fixture.destroy();
  });
});
