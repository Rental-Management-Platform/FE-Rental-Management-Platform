import type { WardBounds } from "@/lib/api/types";
import { CITY_BOXES } from "./config";
import type { Pin } from "./pin";

// Where a pin may be (spec 0011, AC-4). The backend keeps the same rules and adds a 500 m margin
// around the ward box. The margin is not used here, so a point the browser accepts is always
// accepted by the backend.

/** Edges count as inside, as they do for the backend. */
export const isInsideBox = (
  { latitude, longitude }: Pin,
  box: WardBounds,
): boolean =>
  latitude >= box.minLatitude &&
  latitude <= box.maxLatitude &&
  longitude >= box.minLongitude &&
  longitude <= box.maxLongitude;

export const isInsideCity = (pin: Pin): boolean =>
  CITY_BOXES.some((box) => isInsideBox(pin, box));

/**
 * The saved point of a property as the public page may show it (spec 0018): both numbers must be
 * there and the point must be inside one of the two city boxes. A property saved before the
 * backend checked its point (before 2026-11-05) can hold one in Hà Nội or at sea, and a wrong
 * pin in public is worse than none. The ward box is not checked, because the listing data does
 * not carry it.
 */
export function publicPin(
  latitude: number | null,
  longitude: number | null,
): Pin | null {
  if (latitude === null || longitude === null) return null;
  const pin = { latitude, longitude };
  return isInsideCity(pin) ? pin : null;
}

/** Why a pin is refused, or `ok`. The city is checked first, as the backend does. */
export type PinCheck = "ok" | "outside-city" | "outside-ward";

/**
 * Checks a pin against the two city boxes and, when the ward has one, the raw box of the ward.
 * `wardBounds` is `null` for a ward an admin added (the API gives it no box) and also while no
 * ward is chosen, so only the city boxes are checked then.
 */
export function checkPin(pin: Pin, wardBounds: WardBounds | null): PinCheck {
  if (!isInsideCity(pin)) return "outside-city";
  if (wardBounds && !isInsideBox(pin, wardBounds)) return "outside-ward";
  return "ok";
}
