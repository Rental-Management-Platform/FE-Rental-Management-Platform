import type { WardBounds } from "@/lib/api/types";
import { checkPin } from "./area";
import { parseCoordinate, roundPin } from "./pin";
import {
  areaMessage,
  BOTH_OR_NONE_MESSAGE,
  LATITUDE_NUMBER_MESSAGE,
  LATITUDE_RANGE_MESSAGE,
  LONGITUDE_NUMBER_MESSAGE,
  LONGITUDE_RANGE_MESSAGE,
} from "./texts";

// The checks of the two number fields, as pure functions of the two texts and the ward, so the
// form schema and the number fields run the same code (spec 0011, AC-6, AC-7).

export type PinFieldName = "latitude" | "longitude";
export interface PinFieldIssue {
  field: PinFieldName;
  message: string;
}

/** The ward the point is checked against: its name for the message and its box, if it has one. */
export interface PinWard {
  name: string;
  bounds: WardBounds | null;
}

/**
 * The messages for the two field texts, in the order the checks run, stopping at the first kind
 * of problem: an empty half, then not a number, then out of range, then the allowed area (on
 * the rounded numbers). Two empty fields are fine, there is simply no pin. The area messages are
 * put on both fields, as the backend does, so that both are marked invalid together.
 */
export function pinFieldIssues(
  latitude: string,
  longitude: string,
  ward: PinWard | null,
): PinFieldIssue[] {
  const latText = latitude.trim();
  const lngText = longitude.trim();
  if (latText === "" && lngText === "") return [];
  if (latText === "" || lngText === "") {
    return [
      {
        field: latText === "" ? "latitude" : "longitude",
        message: BOTH_OR_NONE_MESSAGE,
      },
    ];
  }

  const lat = parseCoordinate(latText);
  const lng = parseCoordinate(lngText);
  const notNumbers: PinFieldIssue[] = [
    ...(lat === null
      ? [{ field: "latitude" as const, message: LATITUDE_NUMBER_MESSAGE }]
      : []),
    ...(lng === null
      ? [{ field: "longitude" as const, message: LONGITUDE_NUMBER_MESSAGE }]
      : []),
  ];
  if (lat === null || lng === null) return notNumbers;

  const outOfRange: PinFieldIssue[] = [
    ...(Math.abs(lat) > 90
      ? [{ field: "latitude" as const, message: LATITUDE_RANGE_MESSAGE }]
      : []),
    ...(Math.abs(lng) > 180
      ? [{ field: "longitude" as const, message: LONGITUDE_RANGE_MESSAGE }]
      : []),
  ];
  if (outOfRange.length > 0) return outOfRange;

  const check = checkPin(
    roundPin({ latitude: lat, longitude: lng }),
    ward?.bounds ?? null,
  );
  if (check === "ok") return [];
  const message = areaMessage(check, ward?.name ?? "");
  return [
    { field: "latitude", message },
    { field: "longitude", message },
  ];
}
