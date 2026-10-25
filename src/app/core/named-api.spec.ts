import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  provideHttpClientTesting,
  HttpTestingController,
} from "@angular/common/http/testing";
import { API_BASE_URL, AuthorsService, CategoriesService } from "./api";
describe.each([
  { kind: "authors", type: AuthorsService },
  { kind: "categories", type: CategoriesService },
])("$kind CRUD contracts", ({ kind, type }) => {
  it("uses real create/update/delete paths and name-only JSON payloads", () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: "https://library.test/api" },
      ],
    });
    const api = TestBed.inject(type);
    const http = TestBed.inject(HttpTestingController);
    api.save("A name").subscribe();
    const create = http.expectOne("https://library.test/api/" + kind);
    expect(create.request.method).toBe("POST");
    expect(create.request.body).toEqual({ name: "A name" });
    create.flush({ success: true, data: { id: 1, name: "A name" } });
    api.save("Updated", 1).subscribe();
    const update = http.expectOne("https://library.test/api/" + kind + "/1");
    expect(update.request.method).toBe("PUT");
    expect(update.request.body).toEqual({ name: "Updated" });
    update.flush({ success: true, data: { id: 1, name: "Updated" } });
    api.delete(1).subscribe();
    const del = http.expectOne("https://library.test/api/" + kind + "/1");
    expect(del.request.method).toBe("DELETE");
    del.flush({ success: true });
    http.verify();
  });
});
