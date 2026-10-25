import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Book } from "../../core/models";
import { CoverComponent } from "../../shared/ui";
@Component({
  selector: "app-book-card",
  imports: [RouterLink, CoverComponent],
  template: `<a class="book-card" [routerLink]="['/books', book().id]"
    ><app-cover [src]="book().imageUrl" [title]="book().title" />
    <h2>{{ book().title }}</h2>
    <p>{{ book().authorName }}</p>
    <small>{{ book().publicationYear }} · {{ book().categoryName }}</small></a
  >`,
})
export class BookCard {
  book = input.required<Book>();
}
