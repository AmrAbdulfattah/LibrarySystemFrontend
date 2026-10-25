import { TestBed } from "@angular/core/testing";
import { PaginationComponent } from "./ui";
describe("Shared pagination", () => {
  function setup(
    page: number,
    pages: number,
    total: number,
    pageSize = 10,
    itemLabel = "books",
    visibleCount?: number,
  ) {
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput("page", page);
    fixture.componentRef.setInput("pages", pages);
    fixture.componentRef.setInput("total", total);
    fixture.componentRef.setInput("pageSize", pageSize);
    fixture.componentRef.setInput("itemLabel", itemLabel);
    if (visibleCount !== undefined)
      fixture.componentRef.setInput("visibleCount", visibleCount);
    fixture.detectChanges();
    return fixture;
  }
  it("marks the current page and disables the first/last boundaries", () => {
    const f = setup(1, 3, 25);
    const root = f.nativeElement as HTMLElement;
    expect(
      root.querySelector('[aria-current="page"]')?.textContent?.trim(),
    ).toBe("1");
    const previous = root.querySelector<HTMLButtonElement>(
      '[aria-label="Previous page"]',
    )!;
    const next = root.querySelector<HTMLButtonElement>(
      '[aria-label="Next page"]',
    )!;
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    const change = vi.fn();
    f.componentInstance.change.subscribe(change);
    root.querySelector<HTMLButtonElement>('[aria-label="Page 2"]')!.click();
    expect(change).toHaveBeenCalledWith(2);
    f.componentRef.setInput("page", 3);
    f.detectChanges();
    expect(previous.disabled).toBe(false);
    expect(next.disabled).toBe(true);
  });
  it("displays totals for a single page and disables both navigation buttons", () => {
    const f = setup(1, 1, 4);
    const root = f.nativeElement as HTMLElement;
    expect(root.textContent).toContain("Showing 1–4 of 4 books");
    expect(root.querySelectorAll("button").length).toBe(3);
    expect([...root.querySelectorAll("button")].every((b) => b.disabled)).toBe(
      true,
    );
  });
  it.each([
    {
      label: "books",
      size: 10,
      total: 17,
      page: 1,
      count: 10,
      text: "Showing 1–10 of 17 books",
    },
    {
      label: "books",
      size: 10,
      total: 17,
      page: 2,
      count: 7,
      text: "Showing 11–17 of 17 books",
    },
    {
      label: "books",
      size: 12,
      total: 17,
      page: 2,
      count: 5,
      text: "Showing 13–17 of 17 books",
    },
    {
      label: "authors",
      size: 10,
      total: 17,
      page: 2,
      count: 7,
      text: "Showing 11–17 of 17 authors",
    },
    {
      label: "categories",
      size: 10,
      total: 17,
      page: 2,
      count: 7,
      text: "Showing 11–17 of 17 categories",
    },
  ])("calculates backend record ranges: $text", (data) => {
    const f = setup(
      data.page,
      2,
      data.total,
      data.size,
      data.label,
      data.count,
    );
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelector(".pagination-summary")?.textContent?.trim()).toBe(
      data.text,
    );
    expect(root.querySelectorAll(".pagination-controls button")).toHaveLength(
      4,
    );
  });
  it("uses the actual returned row count rather than claiming a full page", () => {
    const f = setup(2, 3, 25, 10, "books", 3);
    expect(f.nativeElement.textContent).toContain("Showing 11–13 of 25 books");
  });
  it("keeps large page counts bounded with accessible first/current/last buttons", () => {
    const f = setup(50, 100, 1000);
    const root = f.nativeElement as HTMLElement;
    expect(
      root.querySelector('[aria-current="page"]')?.textContent?.trim(),
    ).toBe("50");
    expect(root.querySelectorAll("button").length).toBeLessThanOrEqual(9);
    expect(root.querySelector('[aria-label="Page 1"]')).not.toBeNull();
    expect(root.querySelector('[aria-label="Page 100"]')).not.toBeNull();
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
