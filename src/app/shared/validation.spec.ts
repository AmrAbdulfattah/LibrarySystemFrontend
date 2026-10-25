import { FormControl } from "@angular/forms";
import { imageError, nonBlank } from "./validation";
describe("Backend-compatible form validation", () => {
  it("rejects whitespace-only names", () => {
    expect(nonBlank(new FormControl("   "))).toEqual({ required: true });
    expect(nonBlank(new FormControl("A title"))).toBeNull();
  });
  it("enforces the actual 3 MB image limit and allowed extensions", () => {
    expect(imageError(new File(["x"], "a.png"))).toBe("");
    expect(imageError(new File(["x"], "a.svg"))).toContain("JPG");
    expect(imageError(new File([], "a.jpg"))).toContain("empty");
    expect(
      imageError(new File([new Uint8Array(3 * 1024 * 1024 + 1)], "a.webp")),
    ).toContain("3 MB");
  });
});
