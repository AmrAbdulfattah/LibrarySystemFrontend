import { Component, DestroyRef, inject, signal } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  catchError,
  combineLatest,
  forkJoin,
  of,
  switchMap,
  tap,
  Subject,
  startWith,
} from "rxjs";
import { BooksService, errorMessage } from "../../core/api";
import { Book, Filters, Named, Page } from "../../core/models";
import { ToastService } from "../../core/toast";
import {
  CoverComponent,
  PaginationComponent,
  StateComponent,
} from "../../shared/ui";
import { ConfirmComponent } from "../../shared/confirm";
import { BookFilters } from "./filters";
import { BookCard } from "./card";
@Component({
  imports: [
    RouterLink,
    BookFilters,
    BookCard,
    CoverComponent,
    PaginationComponent,
    StateComponent,
    ConfirmComponent,
  ],
  templateUrl: "./list.html",
})
export class BookList {
  private api = inject(BooksService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy = inject(DestroyRef);
  private toast = inject(ToastService);
  private refresh = new Subject<void>();
  admin = !!this.route.snapshot.data["admin"];
  loading = signal(true);
  error = signal("");
  optionError = signal("");
  authors = signal<Named[]>([]);
  categories = signal<Named[]>([]);
  years = signal<number[]>([]);
  data = signal<Page<Book> | null>(null);
  deleting = signal<Book | null>(null);
  deleteBusy = signal(false);
  deleteError = signal("");
  page = signal(1);
  form = new FormGroup({
    publicationYear: new FormControl("", { nonNullable: true }),
    authorId: new FormControl("", { nonNullable: true }),
    categoryId: new FormControl("", { nonNullable: true }),
  });
  constructor() {
    this.loadOptions();
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.navigate(1));
    combineLatest([
      this.route.queryParamMap,
      this.refresh.pipe(startWith(undefined)),
    ])
      .pipe(
        tap(([params]) => {
          this.page.set(Math.max(1, Number(params.get("page")) || 1));
          this.form.setValue(
            {
              authorId: params.get("authorId") || "",
              categoryId: params.get("categoryId") || "",
              publicationYear: params.get("publicationYear") || "",
            },
            { emitEvent: false },
          );
        }),
        switchMap(() => {
          this.loading.set(true);
          this.error.set("");
          return this.api.list(this.filters(), this.page()).pipe(
            catchError((e) => {
              this.error.set(errorMessage(e));
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((data) => {
        this.data.set(data);
        this.loading.set(false);
      });
  }
  loadOptions() {
    this.optionError.set("");
    forkJoin({
      authors: this.api.options,
      categories: this.api.categories,
      years: this.api.years,
    })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (o) => {
          this.authors.set(o.authors);
          this.categories.set(o.categories);
          this.years.set(o.years);
        },
        error: (e) => this.optionError.set(errorMessage(e)),
      });
  }
  filters(): Filters {
    const v = this.form.getRawValue();
    return {
      authorId: Number(v.authorId) || undefined,
      categoryId: Number(v.categoryId) || undefined,
      publicationYear: Number(v.publicationYear) || undefined,
    };
  }
  navigate(page: number) {
    const f = this.filters();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...f, page: page === 1 ? null : page },
    });
  }
  clear() {
    this.form.reset({ publicationYear: "", authorId: "", categoryId: "" });
  }
  reload() {
    this.refresh.next();
  }
  confirmDelete() {
    const book = this.deleting();
    if (!book) return;
    this.deleteBusy.set(true);
    this.deleteError.set("");
    this.api
      .delete(book.id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.deleteBusy.set(false);
          this.deleting.set(null);
          this.toast.show("Book deleted.");
          this.loadOptions();
          if (this.data()?.items.length === 1 && this.page() > 1)
            this.navigate(this.page() - 1);
          else this.reload();
        },
        error: (e) => {
          this.deleteError.set(errorMessage(e));
          this.deleteBusy.set(false);
        },
      });
  }
}
