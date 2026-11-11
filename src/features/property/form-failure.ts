import type { Path } from "react-hook-form";
import { fieldErrors } from "@/lib/api/errors";
import type { PropertyInput } from "./schemas/property-schema";

// What the property form does with a failed save, kept out of the component so the create form
// and the `/dev/ui` sample run the same code (spec 0017, AC-9, AC-10 and AC-16).

/**
 * The form's own paths in screen order. A message the backend sends for a field this form lacks
 * is shown as the form level message, and focus goes to the first field in this order. `fees`
 * covers every `fees.N.*` and the whole zone (`applyFieldErrors` treats a parent path as known).
 */
export const PROPERTY_FORM_FIELDS: readonly Path<PropertyInput>[] = [
  "name",
  "addressText",
  "wardCode",
  "fees",
  "amenityKeys",
];

/** Shown in the amenities zone after `AMENITY_UNKNOWN`, once the removed boxes have been cleared. */
export const AMENITY_REMOVED_MESSAGE =
  "Một số tiện ích đã bị gỡ khỏi danh sách và đã được bỏ chọn. Hãy xem lại rồi bấm Tạo nhà trọ.";

/**
 * A message for the whole fees zone (a kind twice, more than six) has no box of its own, so
 * `setError` has nothing to focus. Focus goes to the first box of the zone instead, when that
 * message is the first one in screen order. A message for a row, or for a field before the zone,
 * already moves focus to its own box (`applyFieldErrors`). `null` when nothing is left to do.
 */
export function zoneFocusTarget(error: unknown): Path<PropertyInput> | null {
  const rank = (field: string) =>
    PROPERTY_FORM_FIELDS.findIndex(
      (path) => field === path || field.startsWith(`${path}.`),
    );
  const first = Object.keys(fieldErrors(error))
    .filter((field) => rank(field) !== -1)
    .sort((a, b) => rank(a) - rank(b))[0];
  return first === "fees" ? "fees.0.kind" : null;
}
