import { AbstractControl, ValidationErrors } from "@angular/forms";
export function nonBlank(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === "string" && control.value.trim()
    ? null
    : { required: true };
}
export function imageError(file: File): string {
  if (!/\.(jpg|jpeg|png|webp)$/i.test(file.name))
    return "Choose a JPG, JPEG, PNG or WEBP image.";
  if (file.size === 0) return "The image is empty.";
  if (file.size > 3 * 1024 * 1024) return "Image size must be 3 MB or less.";
  return "";
}
