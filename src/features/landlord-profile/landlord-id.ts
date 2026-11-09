import { z } from "zod";

// The shape of an id, not a check that it is a version 4 or 7 one: the backend decides what it
// accepts, and this only has to catch an address that cannot be an id.
const idShape = z.guid();

/** The id of the section that holds the landlord's listings. The reviews hint links to it (spec 0013). */
export const LISTINGS_ANCHOR = "tin-dang";

/**
 * True when the text has the shape of a UUID. The profile page checks this first, so an address
 * such as `/chu-tro/abc` shows "not found" without spending one of the shared 300 reads a minute
 * (the contract answers 400 `INVALID_ID` to it).
 */
export const isLandlordId = (value: unknown): value is string =>
  idShape.safeParse(value).success;

/** The address of a landlord's public profile. */
export const landlordPath = (id: string) => `/chu-tro/${id}`;

/**
 * The address of one page of the landlord's listings. Page 1 leaves `page` out, and the address
 * ends at the listings section, so moving to another page keeps the person at the list and not at
 * the top of the profile.
 */
export function landlordListingsHref(id: string, page: number): string {
  const base = landlordPath(id);
  return `${page > 1 ? `${base}?page=${page}` : base}#${LISTINGS_ANCHOR}`;
}
