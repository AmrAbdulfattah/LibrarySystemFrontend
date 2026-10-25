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
      http
        .expectOne("https://library.test/api/books/" + id)
        .flush({
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
        data: { items: [], pageNumber: 1, totalPages: 0 },
      });
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
