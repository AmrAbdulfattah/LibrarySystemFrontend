import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
@Component({
  imports: [RouterLink, RouterOutlet],
  template: `<header class="public-header">
      <a routerLink="/" class="brand">Library</a>
    </header>
    <main id="main" class="catalog-container"><router-outlet /></main>`,
})
export class PublicLayout {}
