import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { fieldErrors } from "@/lib/api/errors";

// An input counts as "known" when a listed path is the field itself or a parent of it, so
// `fees` covers `fees.0.price` and a field array needs no list of every row.
const isKnown = (known: readonly string[], field: string) =>
  known.some((path) => field === path || field.startsWith(`${path}.`));

/**
 * Puts what the backend said about each input under that input. A message goes to the same
 * path in the form (`fees.0.price` stays `fees.0.price`). A message for a field the form does
 * not have goes to `root.server`, so it is shown as a form level message and never lost.
 *
 * React Hook Form cannot tell which inputs exist, so `fields` lists the form's own paths
 * (for example `["email", "password"]`).
 */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
  fields: readonly Path<T>[],
): void {
  const unplaced: string[] = [];

  for (const [field, message] of Object.entries(fieldErrors(error))) {
    if (isKnown(fields, field)) {
      setError(field as Path<T>, { type: "server", message });
    } else {
      unplaced.push(message);
    }
  }

  if (unplaced.length > 0) {
    setError("root.server", { type: "server", message: unplaced.join(" ") });
  }
}
