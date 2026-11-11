import type { FeeKind, FeeUnit, PropertyFee } from "@/lib/api/types";

// The fees of a property on top of the rent (api-for-frontend.md, 6.17; spec 0017). Everything in
// this file is a pure value or function, so the create form and the edit form of #12 build their
// rows and their request body the same way.

/** The kinds in the order the API gives them. The same order picks the kind of a new row. */
export const FEE_KINDS = [
  "electricity",
  "water",
  "internet",
  "parking",
  "service",
  "other",
] as const satisfies readonly FeeKind[];

/** The units a fee can be charged by, in the order the select lists them. */
export const FEE_UNITS = [
  "per_kwh",
  "per_m3",
  "per_month",
  "per_person_month",
  "per_vehicle_month",
] as const satisfies readonly FeeUnit[];

/**
 * The unit a new row, or a row whose kind just changed, starts with. The backend does not tie a
 * kind to a unit, so this is only a sensible start, and the landlord can pick any of the five.
 */
export const DEFAULT_UNIT_BY_KIND: Record<FeeKind, FeeUnit> = {
  electricity: "per_kwh",
  water: "per_m3",
  internet: "per_month",
  parking: "per_vehicle_month",
  service: "per_month",
  other: "per_month",
};

/** A kind is charged once, so a property has as many fees as there are kinds. */
export const MAX_FEES = FEE_KINDS.length;
export const MAX_FEE_PRICE = 100_000_000;
/** Nine digits, so the box cannot take more than the API accepts (100,000,000 has nine). */
export const FEE_PRICE_MAX_LENGTH = String(MAX_FEE_PRICE).length;
export const MAX_FEE_NOTE_LENGTH = 100;

/** One row as the form holds it while the person types: the price stays text until it is checked. */
export interface FeeRowInput {
  kind: FeeKind;
  price: string;
  unit: FeeUnit;
  note: string;
}

/** The first kind, in API order, that no row holds yet. `undefined` when all six are taken. */
export const nextFreeKind = (
  rows: readonly Pick<FeeRowInput, "kind">[],
): FeeKind | undefined =>
  FEE_KINDS.find((kind) => !rows.some((row) => row.kind === kind));

/**
 * The kinds the select of the row at `index` lists: its own kind and the kinds no other row holds.
 * A kind another row holds is left out of the list, not greyed out.
 */
export const kindOptions = (
  rows: readonly Pick<FeeRowInput, "kind">[],
  index: number,
): FeeKind[] =>
  FEE_KINDS.filter(
    (kind) =>
      rows[index]?.kind === kind ||
      !rows.some((row, at) => at !== index && row.kind === kind),
  );

/**
 * The unit after a row changes its kind. It follows the new kind only while it is still the
 * default of the old kind; a unit the landlord chose by hand is kept.
 */
export const unitAfterKindChange = (
  oldKind: FeeKind,
  newKind: FeeKind,
  unit: FeeUnit,
): FeeUnit =>
  unit === DEFAULT_UNIT_BY_KIND[oldKind] ? DEFAULT_UNIT_BY_KIND[newKind] : unit;

/**
 * A typed price as a number, or `null` while it is not one: the text must be digits only (no dot,
 * no comma, no sign). The range is the schema's business, not this function's.
 */
export const readFeePrice = (text: string): number | null =>
  /^\d+$/.test(text.trim()) ? Number(text.trim()) : null;

/**
 * The fees part of the request body, from rows the schema already checked: the rows keep the
 * order they have on screen (the backend reports `fees.N.*` by that index), the price is a whole
 * number, and a note that is empty after trimming is `null`.
 */
export const toFeesBody = (
  rows: readonly {
    kind: FeeKind;
    price: number;
    unit: FeeUnit;
    note: string;
  }[],
): PropertyFee[] =>
  rows.map(({ kind, price, unit, note }) => ({
    kind,
    price,
    unit,
    note: note === "" ? null : note,
  }));
