import { Component, input, output } from "@angular/core";
import { ReactiveFormsModule, FormControl, FormGroup } from "@angular/forms";
import { Named } from "../../core/models";
@Component({
  selector: "app-book-filters",
  imports: [ReactiveFormsModule],
  template: `<form class="filters" [formGroup]="form()">
    <label
      ><span class="sr-only">Publication Year</span
      ><select formControlName="publicationYear">
        <option value="">All Publication Years</option>
        @for (year of years(); track year) {
          <option [value]="year">{{ year }}</option>
        }
      </select></label
    ><label
      ><span class="sr-only">Author</span
      ><select formControlName="authorId">
        <option value="">All Authors</option>
        @for (author of authors(); track author.id) {
          <option [value]="author.id">{{ author.name }}</option>
        }
      </select></label
    ><label
      ><span class="sr-only">Category</span
      ><select formControlName="categoryId">
        <option value="">All Categories</option>
        @for (category of categories(); track category.id) {
          <option [value]="category.id">{{ category.name }}</option>
        }
      </select></label
    ><button type="button" class="text-button" (click)="clear.emit()">
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
  years = input<number[]>([]);
  clear = output();
}
