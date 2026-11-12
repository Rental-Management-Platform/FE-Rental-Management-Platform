// The street text a reverse lookup gives, as a pure function (spec 0011, AC-9).

/** The street part of an OpenStreetMap answer: either part can be missing. */
export interface Street {
  houseNumber: string | null;
  road: string | null;
}

// The limits of the "Số nhà và tên đường" field (the property schema holds the same ones).
const MIN_STREET_LENGTH = 5;
const MAX_STREET_LENGTH = 200;

/**
 * "{số nhà} {tên đường}", the road alone when the answer has no number, or `null` when there is
 * no road or the text does not fit the field (5 to 200 characters). Only the street part is
 * used: the full OpenStreetMap name can carry old district names that no longer exist.
 */
export function streetText({ houseNumber, road }: Street): string | null {
  const cleanRoad = road?.trim() ?? "";
  if (cleanRoad === "") return null;
  const cleanNumber = houseNumber?.trim() ?? "";
  const text = cleanNumber === "" ? cleanRoad : `${cleanNumber} ${cleanRoad}`;
  return text.length >= MIN_STREET_LENGTH && text.length <= MAX_STREET_LENGTH
    ? text
    : null;
}
