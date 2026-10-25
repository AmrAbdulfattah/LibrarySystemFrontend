import { Routes } from "@angular/router";
import { adminGuard } from "./core/auth";
export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./features/public/layout").then((m) => m.PublicLayout),
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./features/books/list").then((m) => m.BookList),
      },
      {
        path: "books/:id",
        loadComponent: () =>
          import("./features/books/details").then((m) => m.BookDetails),
      },
    ],
  },
  {
    path: "admin/login",
    loadComponent: () =>
      import("./features/auth/login").then((m) => m.LoginPage),
  },
  {
    path: "admin",
    canActivate: [adminGuard],
    canActivateChild: [adminGuard],
    loadComponent: () =>
      import("./features/admin/layout").then((m) => m.AdminLayout),
    children: [
      { path: "", pathMatch: "full", redirectTo: "books" },
      {
        path: "books",
        loadComponent: () =>
          import("./features/books/list").then((m) => m.BookList),
        data: { admin: true },
      },
      {
        path: "books/new",
        loadComponent: () =>
          import("./features/books/form").then((m) => m.BookFormPage),
      },
      {
        path: "books/:id/edit",
        loadComponent: () =>
          import("./features/books/form").then((m) => m.BookFormPage),
      },
      {
        path: "books/:id",
        loadComponent: () =>
          import("./features/books/details").then((m) => m.BookDetails),
        data: { admin: true },
      },
      {
        path: "authors",
        loadComponent: () =>
          import("./features/admin/named-list").then((m) => m.NamedList),
        data: { kind: "authors" },
      },
      {
        path: "categories",
        loadComponent: () =>
          import("./features/admin/named-list").then((m) => m.NamedList),
        data: { kind: "categories" },
      },
    ],
  },
  {
    path: "**",
    loadComponent: () =>
      import("./features/public/not-found").then((m) => m.NotFound),
  },
];
