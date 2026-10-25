import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
@Component({
  imports: [RouterLink],
  template: `<main id="main" class="state">
    <h1>Page not found</h1>
    <a routerLink="/">Back to Books →</a>
  </main>`,
})
export class NotFound {}
