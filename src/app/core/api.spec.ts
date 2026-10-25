import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { BooksService, API_BASE_URL } from "./api";
describe("Books API contracts", () => {
  let service: BooksService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: "https://library.test/api" },
      ],
    });
    service = TestBed.inject(BooksService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it("sends all filters together with real pagination names", () => {
    service
      .list({ authorId: 2, categoryId: 3, publicationYear: 2020 }, 4)
      .subscribe();
    const req = http.expectOne(
      (r) => r.url === "https://library.test/api/books",
    );
    expect(
      Object.fromEntries(
        req.request.params.keys().map((k) => [k, req.request.params.get(k)]),
      ),
    ).toEqual({
      authorId: "2",
      categoryId: "3",
      publicationYear: "2020",
      pageNumber: "4",
      pageSize: "12",
    });
    req.flush({
      success: true,
      data: {
        items: [],
        pageNumber: 4,
        pageSize: 12,
        totalCount: 0,
        totalPages: 0,
      },
    });
  });
  it("uses multipart create and separate image update", () => {
    const file = new File(["cover"], "cover.png", { type: "image/png" });
    service
      .create(
        { title: "A book", publicationYear: 2020, authorId: 2, categoryId: 3 },
        file,
      )
      .subscribe();
    const req = http.expectOne("https://library.test/api/books");
    expect(req.request.method).toBe("POST");
    expect(req.request.body.get("Image")).toBe(file);
    expect(req.request.body.get("AuthorId")).toBe("2");
    req.flush({ success: true, data: { id: 1 } });
    service.image(1, file).subscribe();
    const img = http.expectOne("https://library.test/api/books/1/image");
    expect(img.request.method).toBe("PUT");
    expect(img.request.body.get("Image")).toBe(file);
    img.flush({ success: true, data: { id: 1 } });
  });
  it("does not treat a failed wrapper as successful data", () => {
    let message = "";
    service.list({}, 1).subscribe({ error: (e) => (message = e.message) });
    http
      .expectOne((r) => r.url.endsWith("/books"))
      .flush({ success: false, message: "Unavailable" });
    expect(message).toBe("Unavailable");
  });
  it("loads fresh filter options after a later visit", () => {
    service.years.subscribe();
    http
      .expectOne("https://library.test/api/books/filters/years")
      .flush({ success: true, data: [1929] });
    let years: number[] = [];
    service.years.subscribe((v) => (years = v));
    http
      .expectOne("https://library.test/api/books/filters/years")
      .flush({ success: true, data: [2020, 1929] });
    expect(years).toEqual([2020, 1929]);
  });
});
