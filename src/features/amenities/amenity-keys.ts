import type { Amenity } from "@/lib/api/types";

// The amenity keys a form holds, as pure functions. A form keeps the keys in catalog order (spec
// 0017), so a body built from them is the same whichever order the boxes were ticked in. The
// catalog is the only source of a key: nothing here invents one.

/** A property holds at most 30 amenities (api-for-frontend.md, 6.17). */
export const MAX_AMENITIES = 30;

/**
 * The keys after one box is ticked or cleared, in catalog order. A held key the catalog does not
 * list (the form was filled before an admin removed it) stays, at the end, so the backend still
 * says `AMENITY_UNKNOWN` about it and the form can drop it then.
 */
export function toggleAmenityKey(
  catalog: readonly Amenity[],
  held: readonly string[],
  key: string,
  checked: boolean,
): string[] {
  const next = new Set(held);
  if (checked) next.add(key);
  else next.delete(key);
  const inCatalog = catalog.map((amenity) => amenity.key);
  return [
    ...inCatalog.filter((catalogKey) => next.has(catalogKey)),
    ...[...next].filter((heldKey) => !inCatalog.includes(heldKey)),
  ];
}

/** The keys that are not in the catalog any more: the ones to clear after `AMENITY_UNKNOWN`. */
export const removedAmenityKeys = (
  catalog: readonly Amenity[],
  held: readonly string[],
): string[] =>
  held.filter((key) => !catalog.some((amenity) => amenity.key === key));
