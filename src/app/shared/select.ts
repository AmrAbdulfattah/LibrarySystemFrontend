import { DOCUMENT } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

export type SelectValue = string | number;
export interface SelectOption {
  value: SelectValue;
  label: string;
}
let nextSelectId = 0;

/** Fixed positioning keeps the panel inside the viewport, including short mobile screens. */
export function selectPanelPosition(
  rect: { left: number; top: number; bottom: number; width: number },
  width: number,
  height: number,
  contentHeight = 240,
  heightLimit = 240,
) {
  const margin = 8,
    gap = 4;
  const below = Math.max(0, height - rect.bottom - gap - margin),
    above = Math.max(0, rect.top - gap - margin);
  const opensAbove =
    below < Math.min(heightLimit, contentHeight) && above > below;
  const maxHeight = Math.min(
    heightLimit,
    Math.max(0, height - 2 * margin),
    opensAbove ? above : below,
  );
  const panelHeight = Math.min(contentHeight, maxHeight);
  const panelWidth = Math.min(rect.width, Math.max(0, width - 2 * margin));
  const preferredTop = opensAbove
    ? rect.top - gap - panelHeight
    : rect.bottom + gap;
  return {
    left: Math.max(margin, Math.min(rect.left, width - panelWidth - margin)),
    top: Math.max(
      margin,
      Math.min(preferredTop, height - margin - panelHeight),
    ),
    width: panelWidth,
    maxHeight,
  };
}

@Component({
  selector: "app-select",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  templateUrl: "./select.html",
  styleUrl: "./select.scss",
})
export class SelectComponent implements ControlValueAccessor {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private document = inject(DOCUMENT);
  private cdr = inject(ChangeDetectorRef);
  private trigger =
    viewChild.required<ElementRef<HTMLButtonElement>>("trigger");
  private panel = viewChild.required<ElementRef<HTMLElement>>("panel");
  readonly id = `library-select-${++nextSelectId}`;
  label = input.required<string>();
  showLabel = input(false);
  options = input<readonly SelectOption[]>([]);
  placeholder = input("Select an option");
  panelMaxHeight = input(240);
  emptyValue = input<SelectValue>("");
  invalid = input(false);
  readonly value = signal<SelectValue | null>(null);
  readonly disabled = signal(false);
  readonly open = signal(false);
  readonly activeIndex = signal(0);
  readonly choices = computed(() => [
    { value: this.emptyValue(), label: this.placeholder() },
    ...this.options(),
  ]);
  readonly selected = computed(() =>
    this.choices().find((option) => option.value === this.value()),
  );
  readonly activeId = computed(() =>
    this.open() ? `${this.id}-option-${this.activeIndex()}` : null,
  );
  readonly supportsPopover =
    typeof this.document.defaultView?.HTMLElement.prototype.showPopover ===
    "function";
  private onChange: (value: SelectValue) => void = () => {};
  private onTouched: () => void = () => {};
  private search = "";
  private searchedAt = 0;

  constructor() {
    const onScroll = (event: Event) => {
      if (
        this.open() &&
        !this.panel().nativeElement.contains(event.target as Node)
      )
        this.position();
    };
    this.document.addEventListener("scroll", onScroll, true);
    inject(DestroyRef).onDestroy(() => {
      this.document.removeEventListener("scroll", onScroll, true);
      if (this.open() && this.supportsPopover)
        this.panel().nativeElement.hidePopover();
    });
  }
  writeValue(value: SelectValue | null): void {
    this.value.set(value);
  }
  registerOnChange(fn: (value: SelectValue) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
    if (disabled) this.close();
  }
  toggle() {
    if (this.open()) this.close();
    else this.show();
  }
  show(last = false) {
    if (this.disabled() || this.open()) return;
    const selected = this.choices().findIndex(
      (option) => option.value === this.value(),
    );
    this.activeIndex.set(
      selected >= 0 ? selected : last ? this.choices().length - 1 : 0,
    );
    this.open.set(true);
    this.search = "";
    this.cdr.detectChanges();
    if (this.supportsPopover) this.panel().nativeElement.showPopover();
    this.position();
    this.revealActive();
  }
  close() {
    if (!this.open()) return;
    if (this.supportsPopover) this.panel().nativeElement.hidePopover();
    this.open.set(false);
    this.search = "";
    this.onTouched();
  }
  choose(index: number) {
    if (this.disabled()) return;
    const option = this.choices()[index];
    if (!option) return;
    if (this.value() !== option.value) {
      this.value.set(option.value);
      this.onChange(option.value);
    }
    this.close();
    this.onTouched();
    this.trigger().nativeElement.focus({ preventScroll: true });
  }
  highlight(index: number, event: PointerEvent) {
    if (event.pointerType !== "touch") this.activeIndex.set(index);
  }
  keydown(event: KeyboardEvent) {
    if (this.disabled()) return;
    const key = event.key;
    if (key === "Tab") {
      this.close();
      return;
    }
    if (key === "Escape") {
      if (this.open()) {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      }
      return;
    }
    if (event.altKey && key === "ArrowUp") {
      event.preventDefault();
      this.close();
      return;
    }
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      if (!this.open()) {
        this.show(key === "ArrowUp");
        return;
      }
      this.activeIndex.update((index) =>
        Math.max(
          0,
          Math.min(
            this.choices().length - 1,
            index + (key === "ArrowDown" ? 1 : -1),
          ),
        ),
      );
      this.revealActive();
      return;
    }
    if (key === "Enter" || key === " ") {
      event.preventDefault();
      if (this.open()) this.choose(this.activeIndex());
      else this.show();
      return;
    }
    if (this.open() && (key === "Home" || key === "End")) {
      event.preventDefault();
      this.activeIndex.set(key === "Home" ? 0 : this.choices().length - 1);
      this.revealActive();
      return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      if (!this.open()) this.show();
      const now = Date.now();
      this.search = now - this.searchedAt > 700 ? key : this.search + key;
      this.searchedAt = now;
      // Repeating a letter cycles matches; other input supports multi-character Arabic/Latin prefixes.
      const prefix = [...this.search].every((c) => c === key)
        ? key
        : this.search;
      const options = this.choices();
      const start =
        this.search.length === 1 || prefix === key ? this.activeIndex() + 1 : 0;
      for (let offset = 0; offset < options.length; offset++) {
        const index = (start + offset) % options.length;
        if (
          options[index].label
            .toLocaleLowerCase()
            .startsWith(prefix.toLocaleLowerCase())
        ) {
          this.activeIndex.set(index);
          this.revealActive();
          break;
        }
      }
    }
  }
  private revealActive() {
    this.cdr.detectChanges();
    this.document
      .getElementById(`${this.id}-option-${this.activeIndex()}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }
  @HostListener("window:resize") position() {
    if (!this.open()) return;
    const view = this.document.defaultView;
    if (!view) return;
    const panel = this.panel().nativeElement;
    const rect = this.trigger().nativeElement.getBoundingClientRect();
    const layout = selectPanelPosition(
      rect,
      view.innerWidth,
      view.innerHeight,
      Math.min(
        this.panelMaxHeight(),
        panel.scrollHeight || this.panelMaxHeight(),
      ),
      this.panelMaxHeight(),
    );
    panel.style.left = layout.left + "px";
    panel.style.top = layout.top + "px";
    panel.style.width = layout.width + "px";
    panel.style.maxHeight = layout.maxHeight + "px";
  }
  @HostListener("document:pointerdown", ["$event"]) outside(event: Event) {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node))
      this.close();
  }
  @HostListener("document:focusin", ["$event"]) focusMoved(event: FocusEvent) {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node))
      this.close();
  }
  blur() {
    this.onTouched();
  }
}
