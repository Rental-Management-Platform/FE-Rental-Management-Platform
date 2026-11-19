import { foldWardText } from "@/features/wards/ward-match";

/**
 * The rows whose name holds what was typed, in the order they came. Accents and case are ignored
 * ("hoa sen" finds "Nhà trọ Hoa Sen"), and any part of the name counts, not only a word start, so
 * a landlord who remembers the middle of a name still finds it. Nothing typed keeps every row.
 * Pure: it never changes `rows`.
 */
export const matchPropertiesByName = <T extends { name: string }>(
  rows: readonly T[],
  text: string,
): T[] => {
  const typed = foldWardText(text);
  return typed === ""
    ? [...rows]
    : rows.filter((row) => foldWardText(row.name).includes(typed));
};
