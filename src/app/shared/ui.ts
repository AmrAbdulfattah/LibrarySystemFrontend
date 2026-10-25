import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { BooksService } from "../core/api";
@Component({
  selector: "app-cover",
  template: `@if (!failed() && url()) {
      <img
        [src]="url()"
        [alt]="title() + ' cover'"
        (error)="failed.set(true)"
        loading="lazy"
      />
    } @else {
      <div
        class="cover-fallback"
        role="img"
        [attr.aria-label]="title() + ': cover unavailable'"
      >
        <span>▤</span><small>Cover unavailable</small>
      </div>
    }`,
  styles: [
    `
      :host {
        display: block;
        aspect-ratio: 2/3;
        background: var(--card);
        border-radius: 4px;
        overflow: hidden;
        box-shadow:
          0 4px 6px -1px #1a382b0d,
          0 10px 24px -4px #1a382b1f;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .cover-fallback {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 12px;
        color: var(--muted);
        padding: 12px;
        text-align: center;
      }
      .cover-fallback span {
        font-size: 32px;
      }
    `,
  ],
})
export class CoverComponent {
  private api = inject(BooksService);
  src = input("");
  title = input("Book");
  failed = signal(false);
  url() {
    return this.src() ? this.api.imageUrl(this.src()) : "";
  }
}
@Component({
  selector: "app-pagination",
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
  template: `@if (pages() > 0 && total() > 0) {
    <nav class="pagination" aria-label="Pagination">
      <p class="pagination-summary" aria-live="polite">
        Showing {{ start() }}–{{ end() }} of {{ total() }} {{ itemLabel() }}
      </p>
      <div class="pagination-controls">
        <button
          type="button"
          aria-label="Previous page"
          (click)="change.emit(page() - 1)"
          [disabled]="page() <= 1 || busy()"
        >
          ← Previous
        </button>
        @for (item of pageItems(); track $index) {
          @if (item) {
            <button
              type="button"
              class="page-number"
              [class.current-page]="item === page()"
              [class.mobile-page]="item >= page() - 1 && item <= page() + 1"
              [attr.aria-current]="item === page() ? 'page' : null"
              [attr.aria-label]="'Page ' + item"
              (click)="change.emit(item)"
              [disabled]="item === page() || busy()"
            >
              {{ item }}
            </button>
          } @else {
            <span class="pagination-ellipsis" aria-hidden="true">…</span>
          }
        }
        <button
          type="button"
          aria-label="Next page"
          (click)="change.emit(page() + 1)"
          [disabled]="page() >= pages() || busy()"
        >
          Next →
        </button>
      </div>
    </nav>
  }`,
})
export class PaginationComponent {
  page = input(1);
  pages = input(0);
  total = input(0);
  pageSize = input(10);
  itemLabel = input("records");
  visibleCount = input<number | null>(null);
  private offset = computed(() =>
    Math.max(0, (this.page() - 1) * this.pageSize()),
  );
  private count = computed(() =>
    Math.max(
      0,
      Math.min(
        this.visibleCount() ?? this.pageSize(),
        this.pageSize(),
        this.total() - this.offset(),
      ),
    ),
  );
  start = computed(() => (this.count() > 0 ? this.offset() + 1 : 0));
  end = computed(() => (this.count() > 0 ? this.offset() + this.count() : 0));
  pageItems = computed<Array<number | null>>(() => {
    const total = this.pages();
    if (total <= 7)
      return Array.from(
        { length: Math.max(0, total) },
        (_, index) => index + 1,
      );
    const selected = [
      ...new Set([1, total, this.page() - 1, this.page(), this.page() + 1]),
    ]
      .filter((p) => p >= 1 && p <= total)
      .sort((a, b) => a - b);
    const items: Array<number | null> = [];
    selected.forEach((p, index) => {
      const previous = selected[index - 1];
      if (index && p - previous === 2) items.push(previous + 1);
      else if (index && p - previous > 2) items.push(null);
      items.push(p);
    });
    return items;
  });
  busy = input(false);
  change = output<number>();
}
@Component({
  selector: "app-state",
  template: `<div class="state" [attr.role]="error() ? 'alert' : 'status'">
    @if (loading()) {
      <span class="spinner" aria-hidden="true"></span>
      <p>Loading library…</p>
    } @else if (error()) {
      <h2>Unable to load</h2>
      <p>{{ error() }}</p>
      <button (click)="retry.emit()">Try again</button>
    } @else {
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
    }
  </div>`,
})
export class StateComponent {
  loading = input(false);
  error = input("");
  title = input("No results");
  message = input("Try adjusting your filters.");
  retry = output();
}
