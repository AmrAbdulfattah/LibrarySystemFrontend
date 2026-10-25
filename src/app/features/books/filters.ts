import { Component, computed, input, output } from "@angular/core";
import { ReactiveFormsModule, FormControl, FormGroup } from "@angular/forms";
import { Named } from "../../core/models";
import { SelectComponent } from "../../shared/select";
@Component({
  selector: "app-book-filters",
  imports: [ReactiveFormsModule, SelectComponent],
  template: `<form class="filters" [formGroup]="form()">
    <div class="filter-field">
      <app-select
        label="Publication Year"
        placeholder="All Publication Years"
        formControlName="publicationYear"
        [options]="yearOptions()"
        [panelMaxHeight]="250"
      />
    </div>
    <div class="filter-field">
      <app-select
        label="Author"
        placeholder="All Authors"
        formControlName="authorId"
        [options]="authorOptions()"
      />
    </div>
    <div class="filter-field">
      <app-select
        label="Category"
        placeholder="All Categories"
        formControlName="categoryId"
        [options]="categoryOptions()"
      />
    </div>
    <button type="button" class="text-button" (click)="clear.emit()">
      ↻ Clear Filters
    </button>
  </form>`,
})
export class BookFilters {
  form = input.required<
    FormGroup<{
      publicationYear: FormControl<string>;
      authorId: FormControl<string>;
      categoryId: FormControl<string>;
    }>
  >();
  authors = input<Named[]>([]);
  categories = input<Named[]>([]);
  authorOptions = computed(() =>
    this.authors().map((a) => ({ value: String(a.id), label: a.name })),
  );
  categoryOptions = computed(() =>
    this.categories().map((c) => ({ value: String(c.id), label: c.name })),
  );
  years = input<number[]>([]);
  yearOptions = computed(() =>
    this.years().map((year) => ({ value: String(year), label: String(year) })),
  );
  clear = output();
}
