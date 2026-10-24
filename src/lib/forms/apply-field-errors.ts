import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { fieldErrors } from "@/lib/api/errors";

// An input counts as "known" when a listed path is the field itself or a parent of it, so
// `fees` covers `fees.0.price` and a field array needs no list of every row.
const isUnder = (path: string, field: string) =>
  field === path || field.startsWith(`${path}.`);

/**
 * Puts what the backend said about each input under that input. A message goes to the same
 * path in the form (`fees.0.price` stays `fees.0.price`). A message for a field the form does
 * not have goes to `root.server`, so it is shown as a form level message and never lost.
 *
 * React Hook Form cannot tell which inputs exist, so `fields` lists the form's own paths in
 * screen order (for example `["email", "password"]`).
 *
 * Focus moves to the first input that got a message, and only that one, so a screen reader
 * hears that input's label and message and the person is not sent past the others. "First" is
 * the order of `fields`, which is the order on screen, and never the order the backend listed
 * its errors in (spec 0005, AC-5).
 */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
  fields: readonly Path<T>[],
): void {
  const entries = Object.entries(fieldErrors(error));
  const rankOf = (field: string) =>
    fields.findIndex((path) => isUnder(path, field));

  // `sort` is stable, so rows of one field array keep the order the backend gave them.
  const placed = entries
    .filter(([field]) => rankOf(field) !== -1)
    .sort(([a], [b]) => rankOf(a) - rankOf(b));
  const unplaced = entries
    .filter(([field]) => rankOf(field) === -1)
    .map(([, message]) => message);

  placed.forEach(([field, message], index) => {
    setError(
      field as Path<T>,
      { type: "server", message },
      { shouldFocus: index === 0 },
    );
  });

  if (unplaced.length > 0) {
    setError("root.server", { type: "server", message: unplaced.join(" ") });
  }
}
