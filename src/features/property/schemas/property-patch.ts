import {
  formatCoordinate,
  pinFromFields,
  roundPin,
  type Pin,
} from "@/features/location-map/pin";
import type { Property, PropertyBody, PropertyFee } from "@/lib/api/types";
import { toFeesBody } from "../fees";
import type { PropertyInput, PropertyValues } from "./property-schema";

// The edit form of a property (spec 0019, AC-13 to AC-15): the saved property as form values, and
// the form values compared with the saved property into a body that holds only what changed. Pure:
// no React, no network.

/** `PATCH /properties/:id` takes any of the fields of the create body. */
export type PropertyPatch = Partial<PropertyBody>;

/**
 * The saved property as the form holds it while the person types (spec 0019, "Value sourcing"):
 * a price is a string, a note that is `null` is an empty string, a coordinate is its text (empty
 * when `null`), and the amenities are their keys. The ward is the nested one's `code`.
 */
export const toPropertyInput = (property: Property): PropertyInput => ({
  name: property.name,
  addressText: property.addressText,
  wardCode: property.ward.code,
  latitude:
    property.latitude === null ? "" : formatCoordinate(property.latitude),
  longitude:
    property.longitude === null ? "" : formatCoordinate(property.longitude),
  fees: property.fees.map(({ kind, price, unit, note }) => ({
    kind,
    price: String(price),
    unit,
    note: note ?? "",
  })),
  amenityKeys: property.amenities.map((amenity) => amenity.key),
});

// The saved pin, rounded the way the form rounds, or `null` when there is none.
const savedPinOf = ({ latitude, longitude }: Property): Pin | null =>
  latitude === null || longitude === null
    ? null
    : roundPin({ latitude, longitude });

const samePin = (a: Pin | null, b: Pin | null) =>
  a === null || b === null
    ? a === b
    : a.latitude === b.latitude && a.longitude === b.longitude;

// Fees compare by kind and by value, in the same form, whatever order the rows are in: the
// backend sorts them, the form keeps the order the person made.
const feeKey = ({ kind, price, unit, note }: PropertyFee) =>
  JSON.stringify([kind, price, unit, note ?? null]);

const sameFees = (a: readonly PropertyFee[], b: readonly PropertyFee[]) =>
  JSON.stringify(a.map(feeKey).toSorted()) ===
  JSON.stringify(b.map(feeKey).toSorted());

// Amenities compare as a set.
const sameKeys = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((key) => b.includes(key));

/**
 * What to send for a save, from the checked form values and the property as the server last
 * held it. Only a field that differs is in the body, and never `propertyId` or a field that did
 * not change; an empty body means there is nothing to send (AC-14).
 *
 * - `name`, `addressText`, `wardCode`: when the text differs.
 * - `fees` and `amenityKeys`: the whole list, when the list differs (an empty list removes them).
 * - The pin: both numbers, or both `null` to clear it, when it differs from the saved one, and
 *   always when the ward changes, so the backend checks the pin against the new ward and a pin
 *   the new ward does not allow was already dropped by the form (spec 0011, AC-10; AC-15). A saved
 *   pin the person did not change is not sent, even when it lies outside its ward.
 */
export function toPropertyPatch(
  values: PropertyValues,
  saved: Property,
): PropertyPatch {
  const wardChanged = values.wardCode !== saved.ward.code;
  const fees = toFeesBody(values.fees);
  const pin = pinFromFields(values.latitude, values.longitude);
  const rounded = pin === null ? null : roundPin(pin);
  const sendPin = wardChanged || !samePin(rounded, savedPinOf(saved));

  return {
    ...(values.name !== saved.name ? { name: values.name } : {}),
    ...(values.addressText !== saved.addressText
      ? { addressText: values.addressText }
      : {}),
    ...(wardChanged ? { wardCode: values.wardCode } : {}),
    ...(sameFees(fees, saved.fees) ? {} : { fees }),
    ...(sameKeys(
      values.amenityKeys,
      saved.amenities.map((amenity) => amenity.key),
    )
      ? {}
      : { amenityKeys: values.amenityKeys }),
    ...(sendPin
      ? rounded === null
        ? { latitude: null, longitude: null }
        : rounded
      : {}),
  };
}
