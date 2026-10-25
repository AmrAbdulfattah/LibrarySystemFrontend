import {
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  AuthorsService,
  CategoriesService,
  errorMessage,
} from "../../core/api";
import { Named, Page } from "../../core/models";
import { ToastService } from "../../core/toast";
import { ConfirmComponent } from "../../shared/confirm";
import { PaginationComponent, StateComponent } from "../../shared/ui";
import { nonBlank } from "../../shared/validation";
import {
  switchMap,
  catchError,
  of,
  tap,
  combineLatest,
  Subject,
  startWith,
  takeUntil,
} from "rxjs";
@Component({
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ConfirmComponent,
    PaginationComponent,
    StateComponent,
  ],
  templateUrl: "./named-list.html",
})
export class NamedList {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy = inject(DestroyRef);
  private toast = inject(ToastService);
  private authors = inject(AuthorsService);
  private categories = inject(CategoriesService);
  private refresh = new Subject<void>();
  private modalClosed = new Subject<void>();
  kind = this.route.snapshot.data["kind"] as "authors" | "categories";
  label = this.kind === "authors" ? "Author" : "Category";
  plural = this.kind === "authors" ? "Authors" : "Categories";
  api = this.kind === "authors" ? this.authors : this.categories;
  maxLength = this.kind === "authors" ? 150 : 100;
  data = signal<Page<Named> | null>(null);
  page = signal(1);
  loading = signal(true);
  error = signal("");
  editing = signal<Named | null>(null);
  viewing = signal<Named | null>(null);
  modalLoading = signal(false);
  modalError = signal("");
  mode = signal<"create" | "edit" | "view">("create");
  busy = signal(false);
  deleting = signal<Named | null>(null);
  deleteError = signal("");
  form = inject(FormBuilder).nonNullable.group({
    name: ["", [nonBlank, Validators.maxLength(this.maxLength)]],
  });
  @ViewChild("editor", { static: true }) editor!: ElementRef<HTMLDialogElement>;
  constructor() {
    combineLatest([
      this.route.queryParamMap,
      this.refresh.pipe(startWith(undefined)),
    ])
      .pipe(
        tap(([p]) => this.page.set(Math.max(1, Number(p.get("page")) || 1))),
        switchMap(() => {
          this.loading.set(true);
          this.error.set("");
          return this.api.list(this.page()).pipe(
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
  navigate(page: number) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page === 1 ? null : page },
    });
  }
  reload() {
    this.refresh.next();
  }
  open(mode: "create" | "edit" | "view", item?: Named) {
    this.modalClosed.next();
    this.modalLoading.set(false);
    this.mode.set(mode);
    this.modalError.set("");
    this.editing.set(item ?? null);
    this.viewing.set(null);
    this.form.reset();
    this.editor.nativeElement.showModal();
    if (item) {
      this.modalLoading.set(true);
      this.api
        .get(item.id)
        .pipe(takeUntil(this.modalClosed), takeUntilDestroyed(this.destroy))
        .subscribe({
          next: (detail) => {
            this.viewing.set(detail);
            this.editing.set(detail);
            this.form.setValue({ name: detail.name });
            this.modalLoading.set(false);
          },
          error: (e) => {
            this.modalLoading.set(false);
            this.modalError.set(errorMessage(e));
          },
        });
    }
  }
  close() {
    if (!this.busy()) {
      this.modalClosed.next();
      this.modalLoading.set(false);
      this.editor.nativeElement.close();
    }
  }
  save() {
    if (this.form.invalid || this.busy() || this.modalLoading()) return;
    this.busy.set(true);
    this.modalError.set("");
    this.api
      .save(this.form.getRawValue().name, this.editing()?.id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.close();
          this.toast.show(this.label + " saved.");
          this.reload();
        },
        error: (e) => {
          this.busy.set(false);
          this.modalError.set(errorMessage(e));
        },
      });
  }
  confirmDelete() {
    const item = this.deleting();
    if (!item) return;
    this.busy.set(true);
    this.deleteError.set("");
    this.api
      .delete(item.id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.deleting.set(null);
          this.toast.show(this.label + " deleted.");
          if (this.data()?.items.length === 1 && this.page() > 1)
            this.navigate(this.page() - 1);
          else this.reload();
        },
        error: (e) => {
          this.busy.set(false);
          this.deleteError.set(errorMessage(e));
        },
      });
  }
}
