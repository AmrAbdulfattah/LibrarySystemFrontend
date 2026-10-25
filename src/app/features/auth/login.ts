import { Component, DestroyRef, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, ActivatedRoute, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AuthService } from "../../core/auth";
import { errorMessage } from "../../core/api";
@Component({
  imports: [ReactiveFormsModule, RouterLink],
  template: `<main id="main" class="login-page">
    <a class="brand" routerLink="/">Library</a>
    <section class="form-panel">
      <span class="eyebrow">Administration</span>
      <h1>Welcome back</h1>
      <p>Sign in to manage your library.</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label
          >Email<input
            type="email"
            formControlName="email"
            autocomplete="username"
            [attr.aria-invalid]="
              form.controls.email.touched && form.controls.email.invalid
            "
        /></label>
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <small class="error"
            >Enter a valid email address, up to 256 characters.</small
          >
        }
        <label
          >Password<input
            type="password"
            formControlName="password"
            autocomplete="current-password"
        /></label>
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <small class="error">Password is required.</small>
        }
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button class="primary full" [disabled]="form.invalid || busy()">
          {{ busy() ? "Signing in…" : "Sign in" }}
        </button>
      </form>
      <a class="back" routerLink="/">← Back to Books</a>
    </section>
  </main>`,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy = inject(DestroyRef);
  form = inject(FormBuilder).nonNullable.group({
    email: [
      "",
      [Validators.required, Validators.email, Validators.maxLength(256)],
    ],
    password: ["", Validators.required],
  });
  busy = signal(false);
  error = signal("");
  submit() {
    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set("");
    const v = this.form.getRawValue();
    this.auth
      .login(v.email, v.password)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => {
          const url = this.route.snapshot.queryParamMap.get("returnUrl");
          void this.router.navigateByUrl(
            url?.startsWith("/admin/") && !url.startsWith("/admin/login")
              ? url
              : "/admin/books",
          );
        },
        error: (e) => {
          this.busy.set(false);
          this.error.set(errorMessage(e));
        },
      });
  }
}
