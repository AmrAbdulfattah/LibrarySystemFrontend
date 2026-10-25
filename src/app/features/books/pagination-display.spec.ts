import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { API_BASE_URL } from "../../core/api";
import { BookList } from "./list";
import { NamedList } from "../admin/named-list";
describe("Pagination display on all list screens", () => {
  it.each([
    {
      screen: "Public Books",
      kind: "books",
      admin: false,
      size: 12,
      count: 5,
      label: "books",
    },
    {
      screen: "Admin Books",
      kind: "books",
      admin: true,
      size: 10,
      count: 7,
      label: "books",
    },
    {
      screen: "Admin Authors",
      kind: "authors",
      admin: true,
      size: 10,
      count: 7,
      label: "authors",
    },
    {
      screen: "Admin Categories",
      kind: "categories",
      admin: true,
      size: 10,
      count: 7,
      label: "categories",
    },
  ])(
    "$screen passes actual backend page size, total and visible rows to the shared component",
    (data) => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: API_BASE_URL, useValue: "https://library.test/api" },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { data: { admin: data.admin, kind: data.kind } },
              queryParamMap: new BehaviorSubject(
                convertToParamMap({ page: "2" }),
              ),
            },
          },
        ],
      });
      const fixture =
        data.kind === "books"
          ? TestBed.createComponent(BookList)
          : TestBed.createComponent(NamedList);
      const http = TestBed.inject(HttpTestingController);
      if (data.kind === "books")
        for (const option of ["authors", "categories", "years"])
          http
            .expectOne("https://library.test/api/books/filters/" + option)
            .flush({ success: true, data: [] });
      const req = http.expectOne(
        (r) => r.url === "https://library.test/api/" + data.kind,
      );
      expect(req.request.params.get("pageSize")).toBe(String(data.size));
      req.flush({
        success: true,
        data: {
          items: Array.from({ length: data.count }, (_, i) => ({
            id: i + 1,
            title: "Book " + i,
            name: "Name " + i,
            authorName: "Author",
            categoryName: "Category",
            publicationYear: 2020,
            imageUrl: "",
          })),
          pageNumber: 2,
          pageSize: data.size,
          totalCount: 17,
          totalPages: 2,
        },
      });
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(
        root.querySelector(".pagination-summary")?.textContent?.trim(),
      ).toBe(`Showing ${data.size + 1}–17 of 17 ${data.label}`);
      expect(root.querySelectorAll(".pagination-controls")).toHaveLength(1);
      expect(
        root.querySelector('[aria-current="page"]')?.textContent?.trim(),
      ).toBe("2");
      expect(
        root.querySelector<HTMLButtonElement>('[aria-label="Next page"]')
          ?.disabled,
      ).toBe(true);
      fixture.destroy();
      http.verify();
    },
  );
});
