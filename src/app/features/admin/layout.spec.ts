import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { AuthService } from "../../core/auth";
import { AdminLayout } from "./layout";
describe("Admin sidebar navigation", () => {
  it("opens only View Website in a new tab with safe rel attributes", () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout: () => {} } },
      ],
    });
    const f = TestBed.createComponent(AdminLayout);
    f.detectChanges();
    const root = f.nativeElement as HTMLElement;
    const website = [...root.querySelectorAll("a")].find((a) =>
      a.textContent?.includes("View Website"),
    )!;
    expect(website.getAttribute("href")).toBe("/");
    expect(website.target).toBe("_blank");
    expect(website.rel).toContain("noopener");
    expect(website.rel).toContain("noreferrer");
    expect(
      [...root.querySelectorAll("nav a")].every(
        (a) => !a.getAttribute("target"),
      ),
    ).toBe(true);
  });
});
