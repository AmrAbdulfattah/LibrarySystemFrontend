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
import { BehaviorSubject } from "rxjs";
import { API_BASE_URL } from "../../core/api";
import { BookList } from "./list";
describe("Catalog request cancellation", () => {
  it("cancels retries when filters change", () => {
    const params = new BehaviorSubject(convertToParamMap({}));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: "https://library.test/api" },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: {} }, queryParamMap: params },
        },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(BookList);
    const c = fixture.componentInstance;
    for (const path of ["authors", "categories", "years"])
      http
        .expectOne("https://library.test/api/books/filters/" + path)
        .flush({ success: true, data: [] });
    http
      .expectOne((r) => r.url.endsWith("/books"))
      .flush({
        success: true,
        data: {
          items: [],
          pageNumber: 1,
          totalPages: 0,
          totalCount: 0,
          pageSize: 12,
        },
      });
    c.reload();
    const retry = http.expectOne((r) => r.url.endsWith("/books"));
    params.next(convertToParamMap({ publicationYear: "1929" }));
    expect(retry.cancelled).toBe(true);
    const filtered = http.expectOne(
      (r) => r.params.get("publicationYear") === "1929",
    );
    filtered.flush({
      success: true,
      data: {
        items: [],
        pageNumber: 1,
        totalPages: 0,
        totalCount: 0,
        pageSize: 12,
      },
    });
    fixture.destroy();
    http.verify();
  });
});
