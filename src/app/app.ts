import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ToastService } from "./core/toast";
@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  template: `<a class="skip" href="#main">Skip to content</a><router-outlet />
    @if (toast.message()) {
      <div class="toast" role="status">
        {{ toast.message()
        }}<button
          aria-label="Dismiss notification"
          (click)="toast.message.set('')"
        >
          ×
        </button>
      </div>
    }`,
})
export class App {
  toast = inject(ToastService);
}
