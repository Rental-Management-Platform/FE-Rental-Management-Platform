// What the review moderation page reads from its address, and how it writes one back (scope #36).
// Pure: no React, no router.

import type { ReviewStatus, Uuid } from "@/lib/api/types";
import { isUuid } from "@/lib/is-uuid";
import { ADMIN_REVIEWS_PATH } from "./admin-reviews-path";

/** The two lists of the page. Landlord reviews are the default and write no `tab`. */
export type ReviewTab = "landlord" | "listing";

/** `all` sends no `status`. The other two are the values of both moderation lists. */
export type StatusFilter = ReviewStatus | "all";

interface SharedFilters {
  status: StatusFilter;
  authorId: Uuid | null;
}

/**
 * The filters of `GET /moderation/reviews` (api-for-frontend.md, 6.40). `all` and `null` mean "not
 * sent". The address is the only owner of this state.
 */
export interface LandlordFilters extends SharedFilters {
  tab: "landlord";
  landlordId: Uuid | null;
}

/**
 * The filters of `GET /moderation/listing-reviews` (6.41). There is no `landlordId` here: the API
 * answers it with 400, because it is the filter of the other list.
 */
export interface ListingFilters extends SharedFilters {
  tab: "listing";
  listingId: Uuid | null;
}

export type ReviewFilters = LandlordFilters | ListingFilters;

/** What each tab shows with a clean address. */
export const NO_LANDLORD_FILTERS: LandlordFilters = {
  tab: "landlord",
  status: "all",
  authorId: null,
  landlordId: null,
};

export const NO_LISTING_FILTERS: ListingFilters = {
  tab: "listing",
  status: "all",
  authorId: null,
  listingId: null,
};

const STATUSES: readonly ReviewStatus[] = ["visible", "hidden_by_admin"];

/** Anything but the room tab is the landlord tab, so an unknown value never breaks the address. */
export const parseReviewTab = (raw: string | null): ReviewTab =>
  raw === "listing" ? "listing" : "landlord";

// An id the API would refuse (not a UUID) is treated as if it were not there, so it is never sent.
// An id with the right shape that belongs to nobody is kept: the API answers it with an empty list.
const idOrNull = (raw: string | null): Uuid | null =>
  raw !== null && isUuid(raw) ? raw : null;

const parseShared = (read: (name: string) => string | null): SharedFilters => ({
  status: STATUSES.find((value) => value === read("status")) ?? "all",
  authorId: idOrNull(read("authorId")),
});

/** The landlord tab never reads `listingId`, so a stray one is never sent to it. */
export const parseLandlordFilters = (
  read: (name: string) => string | null,
): LandlordFilters => ({
  tab: "landlord",
  ...parseShared(read),
  landlordId: idOrNull(read("landlordId")),
});

/** The room tab never reads `landlordId`, so a stray one is never sent to it. */
export const parseListingFilters = (
  read: (name: string) => string | null,
): ListingFilters => ({
  tab: "listing",
  ...parseShared(read),
  listingId: idOrNull(read("listingId")),
});

/** The filters an address asks for, for the tab it names. */
export const parseReviewFilters = (
  read: (name: string) => string | null,
): ReviewFilters =>
  parseReviewTab(read("tab")) === "listing"
    ? parseListingFilters(read)
    : parseLandlordFilters(read);

export function sameFilters(a: ReviewFilters, b: ReviewFilters): boolean {
  if (a.status !== b.status || a.authorId !== b.authorId) return false;
  if (a.tab === "landlord") {
    return b.tab === "landlord" && a.landlordId === b.landlordId;
  }
  return b.tab === "listing" && a.listingId === b.listingId;
}

/** The clean filters of the tab the given filters are on. */
export const clearFilters = (filters: ReviewFilters): ReviewFilters =>
  filters.tab === "landlord" ? NO_LANDLORD_FILTERS : NO_LISTING_FILTERS;

/** True when anything is filtered. */
export const hasFilters = (filters: ReviewFilters): boolean =>
  !sameFilters(filters, clearFilters(filters));

/**
 * The address of one page of one set of filters. Only what is set is written, the landlord tab and
 * page 1 leave their parameter out, so the clean address is the one a person shares.
 */
export function adminReviewsHref(filters: ReviewFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.tab === "listing") params.set("tab", "listing");
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.tab === "landlord" && filters.landlordId !== null) {
    params.set("landlordId", filters.landlordId);
  }
  if (filters.tab === "listing" && filters.listingId !== null) {
    params.set("listingId", filters.listingId);
  }
  if (filters.authorId !== null) params.set("authorId", filters.authorId);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query === "" ? ADMIN_REVIEWS_PATH : `${ADMIN_REVIEWS_PATH}?${query}`;
}

/**
 * The filters of another tab, from the ones on screen. The status and the writer mean the same in
 * both lists, so they stay; the landlord and the listing belong to one list each, so they go.
 */
export const switchTab = (
  filters: ReviewFilters,
  tab: ReviewTab,
): ReviewFilters => {
  const shared = { status: filters.status, authorId: filters.authorId };
  return tab === "landlord"
    ? { ...NO_LANDLORD_FILTERS, ...shared }
    : { ...NO_LISTING_FILTERS, ...shared };
};
