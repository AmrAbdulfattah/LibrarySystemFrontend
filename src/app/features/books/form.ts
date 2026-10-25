import { Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { forkJoin, of, switchMap, catchError, throwError } from "rxjs";
import {
  AuthorsService,
  BooksService,
  CategoriesService,
  errorMessage,
} from "../../core/api";
import { Named } from "../../core/models";
import { ToastService } from "../../core/toast";
import { StateComponent } from "../../shared/ui";
import { expand, reduce, EMPTY } from "rxjs";
import { NamedService } from "../../core/api";
import { imageError, nonBlank } from "../../shared/validation";
import { SelectComponent } from "../../shared/select";
// Follow the paginated APIs until all relationship choices have been loaded.
export function allOptions(service: NamedService) {
  return service.list().pipe(
    expand((page) =>
      page.pageNumber < page.totalPages
        ? service.list(page.pageNumber + 1)
        : EMPTY,
    ),
    reduce((items: Named[], page) => [...items, ...page.items], []),
  );
}
@Component({
  imports: [ReactiveFormsModule, RouterLink, StateComponent, SelectComponent],
  templateUrl: "./form.html",
})
export class BookFormPage {
  private api = inject(BooksService);
  private authorsApi = inject(AuthorsService);
  private categoriesApi = inject(CategoriesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy = inject(DestroyRef);
  private toast = inject(ToastService);
  id = Number(this.route.snapshot.paramMap.get("id")) || undefined;
  maxYear = new Date().getUTCFullYear();
  loading = signal(true);
  loadError = signal("");
  error = signal("");
  busy = signal(false);
  authors = signal<Named[]>([]);
  categories = signal<Named[]>([]);
  authorOptions = computed(() =>
    this.authors().map((a) => ({ value: a.id, label: a.name })),
  );
  categoryOptions = computed(() =>
    this.categories().map((c) => ({ value: c.id, label: c.name })),
  );
  preview = signal("");
  imageIssue = signal("");
  file: File | null = null;
  private objectUrl = "";
  form = inject(FormBuilder).nonNullable.group({
    title: ["", [nonBlank, Validators.maxLength(200)]],
    publicationYear: [
      this.maxYear,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(this.maxYear),
        Validators.pattern(/^\d+$/),
      ],
    ],
    authorId: [0, [Validators.required, Validators.min(1)]],
    categoryId: [0, [Validators.required, Validators.min(1)]],
  });
  constructor() {
    this.load();
    this.destroy.onDestroy(() => {
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    });
  }
  load() {
    this.loading.set(true);
    this.loadError.set("");
    forkJoin({
      authors: allOptions(this.authorsApi),
      categories: allOptions(this.categoriesApi),
      book: this.id ? this.api.get(this.id) : of(null),
    })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (data) => {
          this.authors.set(data.authors);
          this.categories.set(data.categories);
          if (data.book) {
            const b = data.book;
            this.form.setValue({
              title: b.title,
              publicationYear: b.publicationYear,
              authorId: b.authorId,
              categoryId: b.categoryId,
            });
            this.preview.set(this.api.imageUrl(b.imageUrl));
          }
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.loadError.set(errorMessage(e));
        },
      });
  }
  selectImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const issue = imageError(file);
    this.imageIssue.set(issue);
    this.file = null;
    if (issue) {
      input.value = "";
      return;
    }
    this.file = file;
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = URL.createObjectURL(file);
    this.preview.set(this.objectUrl);
  }
  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy() || this.imageIssue()) return;
    if (!this.id && !this.file) {
      this.imageIssue.set("A cover image is required.");
      return;
    }
    this.busy.set(true);
    this.error.set("");
    const value = this.form.getRawValue();
    const request = this.id
      ? this.api.update(this.id, value)
      : this.api.create(value, this.file!);
    request
      .pipe(
        switchMap((book) => {
          return this.id && this.file
            ? this.api
                .image(book.id, this.file)
                .pipe(
                  catchError((e) =>
                    throwError(
                      () =>
                        new Error(
                          "Book details were saved, but the cover could not be replaced. " +
                            errorMessage(e),
                        ),
                    ),
                  ),
                )
            : of(book);
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe({
        next: () => {
          this.toast.show(this.id ? "Book updated." : "Book created.");
          void this.router.navigate(["/admin/books"]);
        },
        error: (e) => {
          this.busy.set(false);
          this.error.set(errorMessage(e));
        },
      });
  }
}
