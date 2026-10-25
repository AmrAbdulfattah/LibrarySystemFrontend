import { Component, inject, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../../core/auth";
@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `<div class="admin-shell">
    <button
      class="mobile-menu"
      (click)="open.set(!open())"
      [attr.aria-expanded]="open()"
      aria-controls="admin-nav"
    >
      ☰ Navigation
    </button>
    <aside [class.open]="open()" id="admin-nav">
      <nav aria-label="Administration">
        <a
          routerLink="/admin/books"
          routerLinkActive="active"
          (click)="open.set(false)"
          ><span aria-hidden="true">▤</span> Books</a
        ><a
          routerLink="/admin/authors"
          routerLinkActive="active"
          (click)="open.set(false)"
          ><span aria-hidden="true">♧</span> Authors</a
        ><a
          routerLink="/admin/categories"
          routerLinkActive="active"
          (click)="open.set(false)"
          ><span aria-hidden="true">⊞</span> Categories</a
        >
      </nav>
      <div class="sidebar-bottom">
        <a href="/" target="_blank" rel="noopener noreferrer">↗ View Website</a
        ><button (click)="auth.logout()">Log out</button>
      </div>
    </aside>
    <main id="main" class="admin-main"><router-outlet /></main>
  </div>`,
})
export class AdminLayout {
  auth = inject(AuthService);
  open = signal(false);
}
