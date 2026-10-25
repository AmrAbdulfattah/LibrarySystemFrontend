import { Component, DestroyRef, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BooksService, errorMessage } from "../../core/api";
import { Book } from "../../core/models";
import { CoverComponent, StateComponent } from "../../shared/ui";
@Component({
  imports: [RouterLink, CoverComponent, StateComponent, DatePipe],
  template: `<a class="back" [routerLink]="admin ? '/admin/books' : '/'"
      >← Back to Books</a
    >
    @if (loading() || error()) {
      <app-state [loading]="loading()" [error]="error()" (retry)="load()" />
    } @else if (book(); as b) {
      <article class="book-detail">
        <app-cover [src]="b.imageUrl" [title]="b.title" />
        <div>
          <span class="eyebrow">{{ b.categoryName }}</span>
          <h1>{{ b.title }}</h1>
          <p class="byline">{{ b.authorName }}</p>
          <dl>
            <dt>Publication year</dt>
            <dd>{{ b.publicationYear }}</dd>
            <dt>Category</dt>
            <dd>{{ b.categoryName }}</dd>
            @if (b.createdAt) {
              <dt>Added to the library</dt>
              <dd>{{ b.createdAt | date: "longDate" }}</dd>
            }
            @if (b.updatedAt) {
              <dt>Last updated</dt>
              <dd>{{ b.updatedAt | date: "longDate" }}</dd>
            }
            @if (admin && b.updatedBy) {
              <dt>Updated by</dt>
              <dd>{{ b.updatedBy }}</dd>
            }
          </dl>
          @if (admin) {
            <a
              class="button primary"
              [routerLink]="['/admin/books', b.id, 'edit']"
              >Edit Book</a
            >
          }
        </div>
      </article>
    }`,
})
export class BookDetails {
  private route = inject(ActivatedRoute);
  private api = inject(BooksService);
  private destroy = inject(DestroyRef);
  admin = !!this.route.snapshot.data["admin"];
  book = signal<Book | null>(null);
  loading = signal(true);
  error = signal("");
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set("");
    this.api
      .get(Number(this.route.snapshot.paramMap.get("id")))
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (b) => {
          this.book.set(b);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.loading.set(false);
        },
      });
  }
}
