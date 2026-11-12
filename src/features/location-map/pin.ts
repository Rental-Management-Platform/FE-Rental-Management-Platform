import type { WardBounds } from "@/lib/api/types";
import { PIN_DECIMALS } from "./config";

// Pure helpers for a pin and for the two number fields that hold it (spec 0011, AC-6, AC-7).

export type Pin = { latitude: number; longitude: number };

/**
 * A move of the open map that did not come from the map itself (spec 0011, AC-5, AC-8): centre
 * on a pin a lookup or the number fields set, or fit a ward after the ward changed. A new object
 * is a new request, so asking for the same move twice moves twice.
 */
export type ViewRequest =
  | { kind: "pin"; pin: Pin; zoom: number }
  | { kind: "ward"; bounds: WardBounds | null };

/**
 * How a pin got where it is. A click or a drag also writes the street into the address field
 * (AC-9); the other two only move the pin.
 */
export type PinSource = "click" | "drag" | "typed" | "lookup";

const COORDINATE_TEXT = /^[+-]?\d+(?:[.,]\d+)?$/;

/**
 * The number in a field, or `null` when the text is not one. A comma counts as a dot, because
 * that is how many people type a decimal in Vietnamese. No exponent, no spaces inside.
 */
export function parseCoordinate(text: string): number | null {
  const trimmed = text.trim();
  if (!COORDINATE_TEXT.test(trimmed)) return null;
  return Number(trimmed.replace(",", "."));
}

const FACTOR = 10 ** PIN_DECIMALS;

/** Rounds to 6 decimals, which is what the form shows and what the request sends. */
export const roundCoordinate = (value: number) =>
  Math.round(value * FACTOR) / FACTOR;

export const roundPin = ({ latitude, longitude }: Pin): Pin => ({
  latitude: roundCoordinate(latitude),
  longitude: roundCoordinate(longitude),
});

/** The text a field shows for a number: up to 6 decimals, no trailing zeros, a dot. */
export const formatCoordinate = (value: number) =>
  String(roundCoordinate(value));

/** The pin that two field texts hold, or `null` when either is empty or not a number. */
export function pinFromFields(latitude: string, longitude: string): Pin | null {
  const lat = parseCoordinate(latitude);
  const lng = parseCoordinate(longitude);
  return lat === null || lng === null
    ? null
    : { latitude: lat, longitude: lng };
}

/** The text for a screen reader after a pin was set: "Đã ghim tại vĩ độ 10.7721, kinh độ 106.6983." */
export const describePin = ({ latitude, longitude }: Pin) =>
  `Đã ghim tại vĩ độ ${formatCoordinate(latitude)}, kinh độ ${formatCoordinate(longitude)}.`;
