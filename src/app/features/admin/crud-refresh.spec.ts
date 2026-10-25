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
import { ToastService } from "../../core/toast";
import { NamedList } from "./named-list";
import { BookList } from "../books/list";
const record = { id: 11, name: "Existing" };
function setup(kind: string, bookRows = 1) {
  const params = new BehaviorSubject(
    convertToParamMap(
      kind === "books"
        ? { page: "2", authorId: "2", categoryId: "3", publicationYear: "2020" }
        : { page: "2" },
    ),
  );
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: "https://library.test/api" },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { data: kind === "books" ? { admin: true } : { kind } },
          queryParamMap: params,
        },
      },
    ],
  });
  vi.spyOn(TestBed.inject(Router), "navigate").mockImplementation(
    (_, extras) => {
      params.next(convertToParamMap(extras?.queryParams ?? {}));
      return Promise.resolve(true);
    },
  );
  const http = TestBed.inject(HttpTestingController);
  const data = {
    items:
      kind === "books"
        ? Array.from({ length: bookRows }, (_, i) => ({
            id: 11 + i,
            title: "Book " + i,
          }))
        : [record],
    pageNumber: 2,
    pageSize: 10,
    totalCount: 10 + bookRows,
    totalPages: 2,
  };
  return { http, data };
}
function flushOptions(http: HttpTestingController) {
  for (const option of ["authors", "categories", "years"])
    http
      .expectOne("https://library.test/api/books/filters/" + option)
      .flush({ success: true, data: [] });
}
describe.each(["authors", "categories"])("%s CRUD refresh behavior", (kind) => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it.each(["create", "edit"] as const)(
    "closes %s modal and refreshes the same server page only after confirmation",
    (mode) => {
      const { http, data } = setup(kind);
      const f = TestBed.createComponent(NamedList);
      f.detectChanges();
      http
        .expectOne((r) => r.url.endsWith("/" + kind))
        .flush({ success: true, data });
      const c = f.componentInstance;
      const dialog = c.editor.nativeElement;
      dialog.showModal = vi.fn();
      dialog.close = vi.fn();
      c.open(mode, mode === "edit" ? record : undefined);
      if (mode === "edit")
        http
          .expectOne("https://library.test/api/" + kind + "/11")
          .flush({ success: true, data: record });
      c.form.setValue({ name: "Updated name" });
      c.save();
      c.save();
      expect(dialog.close).not.toHaveBeenCalled();
      expect(TestBed.inject(ToastService).message()).toBe("");
      const req = http.expectOne(
        "https://library.test/api/" + kind + (mode === "edit" ? "/11" : ""),
      );
      expect(req.request.method).toBe(mode === "edit" ? "PUT" : "POST");
      req.flush({ success: true, data: record });
      expect(dialog.close).toHaveBeenCalledOnce();
      expect(TestBed.inject(ToastService).message()).toContain("saved");
      const refreshed = http.expectOne((r) => r.url.endsWith("/" + kind));
      expect(refreshed.request.params.get("pageNumber")).toBe("2");
      expect(refreshed.request.params.get("pageSize")).toBe("10");
      refreshed.flush({ success: true, data });
      f.destroy();
    },
  );
  it("retains the modal and inputs after failed save without navigation or a success toast", () => {
    const { http, data } = setup(kind);
    const f = TestBed.createComponent(NamedList);
    f.detectChanges();
    http
      .expectOne((r) => r.url.endsWith("/" + kind))
      .flush({ success: true, data });
    const c = f.componentInstance;
    c.editor.nativeElement.showModal = vi.fn();
    c.editor.nativeElement.close = vi.fn();
    c.open("create");
    c.form.setValue({ name: "New name" });
    c.save();
    http
      .expectOne("https://library.test/api/" + kind)
      .flush({ message: "Cannot save" }, { status: 400, statusText: "Error" });
    expect(c.editor.nativeElement.close).not.toHaveBeenCalled();
    expect(c.form.controls.name.value).toBe("New name");
    expect(c.busy()).toBe(false);
    expect(TestBed.inject(ToastService).message()).toBe("");
    http.expectNone((r) => r.method === "GET");
    f.destroy();
  });
  it("waits for deletion, prevents duplicates and moves the final page row to the previous valid page", () => {
    const { http, data } = setup(kind);
    const f = TestBed.createComponent(NamedList);
    http
      .expectOne((r) => r.url.endsWith("/" + kind))
      .flush({ success: true, data });
    const c = f.componentInstance;
    c.deleting.set(record);
    c.confirmDelete();
    c.confirmDelete();
    const req = http.expectOne("https://library.test/api/" + kind + "/11");
    expect(req.request.method).toBe("DELETE");
    expect(c.data()?.items).toHaveLength(1);
    expect(TestBed.inject(ToastService).message()).toBe("");
    req.flush({ success: true });
    const refreshed = http.expectOne((r) => r.url.endsWith("/" + kind));
    expect(refreshed.request.params.get("pageNumber")).toBe("1");
    refreshed.flush({
      success: true,
      data: { ...data, pageNumber: 1, totalPages: 1, totalCount: 10 },
    });
    expect(c.deleting()).toBeNull();
    expect(TestBed.inject(ToastService).message()).toContain("deleted");
    f.destroy();
  });
  it("keeps existing rows when deletion fails", () => {
    const { http, data } = setup(kind);
    const f = TestBed.createComponent(NamedList);
    http
      .expectOne((r) => r.url.endsWith("/" + kind))
      .flush({ success: true, data });
    const c = f.componentInstance;
    c.deleting.set(record);
    c.confirmDelete();
    http
      .expectOne("https://library.test/api/" + kind + "/11")
      .flush(
        { message: "Has active books" },
        { status: 400, statusText: "Error" },
      );
    expect(c.data()?.items[0].id).toBe(11);
    expect(c.deleteError()).toContain("Has active books");
    expect(TestBed.inject(ToastService).message()).toBe("");
    f.destroy();
  });
});
describe("Book deletion refresh", () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it.each([1, 2])(
    "preserves all filters and recovers the page after deleting from %s rows",
    (rows) => {
      const { http, data } = setup("books", rows);
      const f = TestBed.createComponent(BookList);
      flushOptions(http);
      http
        .expectOne((r) => r.url.endsWith("/books"))
        .flush({ success: true, data });
      const c = f.componentInstance;
      c.deleting.set(c.data()!.items[0]);
      c.confirmDelete();
      c.confirmDelete();
      const req = http.expectOne("https://library.test/api/books/11");
      expect(c.data()?.items).toHaveLength(rows);
      expect(TestBed.inject(ToastService).message()).toBe("");
      req.flush({ success: true });
      flushOptions(http);
      const refreshed = http.expectOne((r) => r.url.endsWith("/books"));
      expect(refreshed.request.params.get("pageNumber")).toBe(
        rows === 1 ? "1" : "2",
      );
      expect(refreshed.request.params.get("pageSize")).toBe("10");
      expect(refreshed.request.params.get("authorId")).toBe("2");
      expect(refreshed.request.params.get("categoryId")).toBe("3");
      expect(refreshed.request.params.get("publicationYear")).toBe("2020");
      refreshed.flush({
        success: true,
        data: { ...data, pageNumber: rows === 1 ? 1 : 2 },
      });
      expect(TestBed.inject(ToastService).message()).toContain("deleted");
      f.destroy();
    },
  );
});
