import { TestBed } from "@angular/core/testing";
import { FormControl, FormGroup } from "@angular/forms";
import { BookFilters } from "./filters";

describe("Shared book filter selectors", () => {
  it("uses the scrollable year selector, preserves string values and highlights selection", () => {
    const { fixture, form, root } = setup();
    const trigger = root.querySelector<HTMLButtonElement>(
      'button[role="combobox"][aria-label="Publication Year"]',
    );
    expect(trigger).not.toBeNull();
    trigger!.click();
    fixture.detectChanges();
    const panel = root.querySelector<HTMLElement>(
      ".select-panel:not([hidden])",
    )!;
    expect(panel.style.maxHeight).toBe("250px");
    const options = panel.querySelectorAll<HTMLElement>('[role="option"]');
    expect(options).toHaveLength(61);
    options[60].click();
    fixture.detectChanges();
    expect(form.controls.publicationYear.value).toBe("1967");
    trigger!.click();
    fixture.detectChanges();
    expect(
      panel.querySelector('[aria-selected="true"]')?.textContent,
    ).toContain("1967");
    trigger!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    trigger!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    fixture.detectChanges();
    expect(form.controls.publicationYear.value).toBe("");
  });
  function setup() {
    const fixture = TestBed.createComponent(BookFilters);
    const form = new FormGroup({
      publicationYear: new FormControl("", { nonNullable: true }),
      authorId: new FormControl("", { nonNullable: true }),
      categoryId: new FormControl("", { nonNullable: true }),
    });
    fixture.componentRef.setInput("form", form);
    fixture.componentRef.setInput(
      "years",
      Array.from({ length: 60 }, (_, i) => 2026 - i),
    );
    fixture.componentRef.setInput(
      "authors",
      Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        name: `كاتب ${i + 1}`,
      })),
    );
    fixture.componentRef.setInput(
      "categories",
      Array.from({ length: 40 }, (_, i) => ({
        id: i + 1,
        name: `تصنيف ${i + 1}`,
      })),
    );
    fixture.detectChanges();
    return { fixture, form, root: fixture.nativeElement as HTMLElement };
  }
  it("uses compact custom selectors for both relationships and preserves string IDs", () => {
    const { fixture, form, root } = setup();
    const authors = root.querySelector<HTMLButtonElement>(
      'button[role="combobox"][aria-label="Author"]',
    );
    expect(authors).not.toBeNull();
    authors!.click();
    fixture.detectChanges();
    const options = root.querySelectorAll<HTMLElement>(
      '.select-panel:not([hidden]) [role="option"]',
    );
    expect(options.length).toBe(41);
    expect(options[40].textContent).toContain("كاتب 40");
    options[40].click();
    fixture.detectChanges();
    expect(form.controls.authorId.value).toBe("40");
    expect(authors!.getAttribute("aria-expanded")).toBe("false");
    expect(
      root.querySelector('button[role="combobox"][aria-label="Category"]'),
    ).not.toBeNull();
  });
  it("supports keyboard selection, Escape, and outside dismissal without changing values", () => {
    const { fixture, form, root } = setup();
    const trigger = root.querySelector<HTMLButtonElement>(
      'button[role="combobox"][aria-label="Author"]',
    );
    expect(trigger).not.toBeNull();
    trigger!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
    );
    trigger!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    trigger!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    fixture.detectChanges();
    expect(form.controls.authorId.value).toBe("40");
    trigger!.click();
    fixture.detectChanges();
    trigger!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    fixture.detectChanges();
    expect(trigger!.getAttribute("aria-expanded")).toBe("false");
    expect(form.controls.authorId.value).toBe("40");
    trigger!.click();
    fixture.detectChanges();
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    fixture.detectChanges();
    expect(trigger!.getAttribute("aria-expanded")).toBe("false");
  });
});
