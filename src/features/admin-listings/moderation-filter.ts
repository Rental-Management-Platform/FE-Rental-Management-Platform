// What the listing moderation page reads from its address, and how it writes one back (scope #21).
// Pure: no React, no router.

import type { ListingStatus, Uuid } from "@/lib/api/types";
import { isUuid } from "@/lib/is-uuid";
import { ADMIN_LISTINGS_PATH } from "./admin-listings-path";

/** `all` sends no `status`. The other three are the values of `GET /moderation/listings`. */
export type StatusFilter = ListingStatus | "all";

/**
 * Every filter of `GET /moderation/listings` (api-for-frontend.md, 6.29). `all`, `null` and the
 * empty text mean "not sent". The address is the only owner of this state.
 */
export interface ModerationFilters {
  status: StatusFilter;
  landlordId: Uuid | null;
  /** Trimmed, at most `MAX_QUERY_LENGTH` characters. "" means no search. */
  q: string;
}

/** What the page shows with a clean address. */
export const NO_MODERATION_FILTERS: ModerationFilters = {
  status: "all",
  landlordId: null,
  q: "",
};

/** The API refuses a longer `q` (6.29 and the limits table), and the page never sends one. */
export const MAX_QUERY_LENGTH = 500;

const STATUSES: readonly ListingStatus[] = [
  "visible",
  "hidden_by_owner",
  "hidden_by_admin",
];

/**
 * The one rule for a search text: trimmed, at most 500 characters, trimmed again after the cut.
 * The address parser and the search box both use it, so a typed text and the same text read back
 * from the address are always the same. The cut counts UTF-16 units, as the API does, and never
 * leaves half of an emoji at the end.
 */
export function cleanQuery(text: string): string {
  const trimmed = text.trim();
  const cut = trimmed.slice(0, MAX_QUERY_LENGTH);
  const last = cut.charCodeAt(cut.length - 1);
  const whole = last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
  return whole.trim();
}

/**
 * The filters an address asks for. A value the API would refuse (an unknown status, an id that is
 * not a UUID) is treated as if it were not there, so it is never sent. An id with the right shape
 * that belongs to nobody is kept: the API answers it with an empty list.
 */
export function parseModerationFilters(
  read: (name: string) => string | null,
): ModerationFilters {
  const status = STATUSES.find((value) => value === read("status"));
  const landlordId = read("landlordId");
  return {
    status: status ?? "all",
    landlordId: landlordId !== null && isUuid(landlordId) ? landlordId : null,
    q: cleanQuery(read("q") ?? ""),
  };
}

export const sameFilters = (
  a: ModerationFilters,
  b: ModerationFilters,
): boolean =>
  a.status === b.status && a.landlordId === b.landlordId && a.q === b.q;

/** True when anything is filtered or searched. */
export const hasFilters = (filters: ModerationFilters): boolean =>
  !sameFilters(filters, NO_MODERATION_FILTERS);

/**
 * The address of one page of one set of filters. Only what is set is written, and page 1 leaves
 * its parameter out, so the clean address is the one a person shares.
 */
export function adminListingsHref(
  filters: ModerationFilters,
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.landlordId !== null) params.set("landlordId", filters.landlordId);
  if (filters.q !== "") params.set("q", filters.q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query === "" ? ADMIN_LISTINGS_PATH : `${ADMIN_LISTINGS_PATH}?${query}`;
}
