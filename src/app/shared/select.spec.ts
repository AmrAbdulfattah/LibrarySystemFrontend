import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { SelectComponent, selectPanelPosition } from "./select";
@Component({
  imports: [SelectComponent, ReactiveFormsModule],
  template: `<app-select
    label="Author"
    placeholder="Choose"
    [emptyValue]="0"
    [options]="options"
    [formControl]="control"
  />`,
})
class Host {
  control = new FormControl(2, { nonNullable: true });
  options = [
    { value: 1, label: "احمد" },
    { value: 2, label: "طه حسين" },
    { value: 3, label: "Virginia Woolf" },
  ];
}
describe("Accessible select", () => {
  it("supports a 250px year panel and opens above near the viewport bottom", () => {
    const below = selectPanelPosition(
      { left: 20, top: 100, bottom: 144, width: 200 },
      800,
      600,
      250,
      250,
    );
    expect(below.maxHeight).toBe(250);
    const above = selectPanelPosition(
      { left: 20, top: 500, bottom: 544, width: 200 },
      800,
      600,
      250,
      250,
    );
    expect(above.maxHeight).toBe(250);
    expect(above.top).toBe(246);
    expect(above.top + above.maxHeight).toBeLessThan(500);
  });
  it("keeps an open panel inside the viewport after its trigger scrolls offscreen", () => {
    const p = selectPanelPosition(
      { left: 20, top: 900, bottom: 944, width: 200 },
      800,
      600,
    );
    expect(p.top + p.maxHeight).toBeLessThanOrEqual(592);
  });
  it("keeps numeric IDs, supports Arabic typeahead and reset, and respects disabled/touched state", () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement as HTMLElement;
    const button = root.querySelector("button")!;
    expect(button.textContent).toContain("طه حسين");
    button.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ا", bubbles: true }),
    );
    button.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    f.detectChanges();
    expect(f.componentInstance.control.value).toBe(1);
    expect(typeof f.componentInstance.control.value).toBe("number");
    expect(f.componentInstance.control.touched).toBe(true);
    f.componentInstance.control.setValue(0);
    f.detectChanges();
    expect(button.textContent).toContain("Choose");
    f.componentInstance.control.disable();
    f.detectChanges();
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });
  it("scrolls keyboard focus into view and closes on Tab without committing navigation", () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const button = f.nativeElement.querySelector("button") as HTMLButtonElement;
    button.click();
    f.detectChanges();
    const last = f.nativeElement.querySelectorAll(
      '[role="option"]',
    )[3] as HTMLElement;
    last.scrollIntoView = vi.fn();
    button.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    expect(last.scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
    button.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
    );
    f.detectChanges();
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(f.componentInstance.control.value).toBe(2);
  });
  it("caps panels at 240px and flips above a trigger near the bottom", () => {
    const below = selectPanelPosition(
      { left: 20, top: 100, bottom: 144, width: 200 },
      800,
      600,
    );
    expect(below.maxHeight).toBe(240);
    expect(below.top).toBe(148);
    const above = selectPanelPosition(
      { left: 20, top: 500, bottom: 544, width: 200 },
      800,
      600,
    );
    expect(above.top).toBe(256);
    expect(above.maxHeight).toBe(240);
  });
  it("keeps panels inside small viewports and clamps horizontal placement", () => {
    const p = selectPanelPosition(
      { left: 280, top: 150, bottom: 194, width: 200 },
      320,
      230,
    );
    expect(p.left + p.width).toBeLessThanOrEqual(312);
    expect(p.maxHeight).toBeLessThanOrEqual(138);
    expect(p.top).toBeGreaterThanOrEqual(8);
  });
});
