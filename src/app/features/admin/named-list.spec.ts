import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { ActivatedRoute, provideRouter } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { convertToParamMap } from "@angular/router";
import { API_BASE_URL } from "../../core/api";
import { NamedList } from "./named-list";
describe("Entity dialog request isolation", () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: "https://library.test/api" },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { kind: "authors" } },
            queryParamMap: new BehaviorSubject(convertToParamMap({})),
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  it("cancels a pending detail request before opening an add form", () => {
    const fixture = TestBed.createComponent(NamedList);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    http
      .expectOne((r) => r.url.endsWith("/authors"))
      .flush({
        success: true,
        data: {
          items: [],
          pageNumber: 1,
          totalPages: 0,
          totalCount: 0,
          pageSize: 10,
        },
      });
    c.editor.nativeElement.showModal = () => {};
    c.editor.nativeElement.close = () => {};
    c.open("edit", { id: 1, name: "A" });
    const detail = http.expectOne("https://library.test/api/authors/1");
    c.close();
    c.open("create");
    expect(detail.cancelled).toBe(true);
    expect(c.modalLoading()).toBe(false);
    expect(c.editing()).toBeNull();
    fixture.destroy();
    http.verify();
  });
});
