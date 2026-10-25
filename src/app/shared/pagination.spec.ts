import { TestBed } from "@angular/core/testing";
import { PaginationComponent } from "./ui";
describe("Shared pagination", () => {
  function setup(page: number, pages: number, total: number) {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput("page", page);
    fixture.componentRef.setInput("pages", pages);
    fixture.componentRef.setInput("total", total);
    fixture.detectChanges();
    return fixture;
  }
  it("marks the current page and disables the first/last boundaries", () => {
    const f = setup(1, 3, 25);
    const root = f.nativeElement as HTMLElement;
    expect(
      root.querySelector('[aria-current="page"]')?.textContent?.trim(),
    ).toBe("1");
    const buttons = root.querySelectorAll("button");
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(false);
    const change = vi.fn();
    f.componentInstance.change.subscribe(change);
    buttons[1].click();
    expect(change).toHaveBeenCalledWith(2);
    f.componentRef.setInput("page", 3);
    f.detectChanges();
    expect(buttons[0].disabled).toBe(false);
    expect(buttons[1].disabled).toBe(true);
  });
  it("displays totals for a single page and disables both navigation buttons", () => {
    const f = setup(1, 1, 4);
    const root = f.nativeElement as HTMLElement;
    expect(root.textContent).toContain("4 results");
    expect(root.querySelectorAll("button").length).toBe(2);
    expect([...root.querySelectorAll("button")].every((b) => b.disabled)).toBe(
      true,
    );
  });
  it("hides empty pagination and disables navigation while busy", () => {
    const f = setup(1, 0, 0);
    expect(f.nativeElement.querySelector("nav")).toBeNull();
    f.componentRef.setInput("pages", 2);
    f.componentRef.setInput("total", 15);
    f.componentRef.setInput("busy", true);
    f.detectChanges();
    expect(
      [...f.nativeElement.querySelectorAll("button")].every(
        (b: any) => b.disabled,
      ),
    ).toBe(true);
  });
});
