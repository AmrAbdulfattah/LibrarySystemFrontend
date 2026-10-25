import {
  Component,
  ElementRef,
  input,
  output,
  viewChild,
  afterNextRender,
  inject,
  DestroyRef,
} from "@angular/core";
@Component({
  selector: "app-confirm",
  template: `<dialog
    #dialog
    (cancel)="busy() ? $event.preventDefault() : cancel.emit()"
    aria-labelledby="confirm-title"
  >
    <h2 id="confirm-title">Delete {{ name() }}?</h2>
    <p>This item will be removed from the active library.</p>
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    <div class="actions">
      <button (click)="cancel.emit()" [disabled]="busy()">Cancel</button
      ><button class="danger" (click)="confirm.emit()" [disabled]="busy()">
        {{ busy() ? "Deleting…" : "Confirm Delete" }}
      </button>
    </div>
  </dialog>`,
})
export class ConfirmComponent {
  name = input.required<string>();
  busy = input(false);
  error = input("");
  cancel = output();
  confirm = output();
  dialog = viewChild.required<ElementRef<HTMLDialogElement>>("dialog");
  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
    inject(DestroyRef).onDestroy(() => this.dialog().nativeElement.close());
  }
}
