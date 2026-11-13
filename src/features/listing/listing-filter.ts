import type { ListingStatus } from "@/lib/api/types";
import { formatCount } from "@/lib/format";

// What "Tin của tôi" reads from its address, and how it writes one back (spec 0019, AC-3 and
// AC-4). Pure: no React, no router.

/** The page of my listings. */
export const MY_LISTINGS_PATH = "/landlord/listings";

/** The post a listing page, and the edit page of one listing (spec 0019, AC-9). */
export const NEW_LISTING_PATH = "/landlord/listings/new";
export const editListingHref = (id: string) =>
  `${MY_LISTINGS_PATH}/${encodeURIComponent(id)}/edit`;

/** `all` sends no `status`. The other three are the `status` of `GET /me/listings`. */
export type ListingFilter = "all" | ListingStatus;

/** The four links of the filter, in screen order. */
export const LISTING_FILTERS: readonly {
  value: ListingFilter;
  label: string;
}[] = [
  { value: "all", label: "Tất cả" },
  { value: "visible", label: "Đang hiện" },
  { value: "hidden_by_owner", label: "Bạn đã ẩn" },
  { value: "hidden_by_admin", label: "Admin đã ẩn" },
];

const STATUSES: readonly ListingStatus[] = [
  "visible",
  "hidden_by_owner",
  "hidden_by_admin",
];

/** The filter an address asks for. A value that is not one of the three statuses is "all". */
export const parseListingFilter = (
  raw: string | null | undefined,
): ListingFilter => STATUSES.find((status) => status === raw) ?? "all";

/**
 * The address of one page of one filter. "Tất cả" and page 1 leave their parameter out, so the
 * clean address is the one a person shares.
 */
export function myListingsHref(filter: ListingFilter, page: number): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query === "" ? MY_LISTINGS_PATH : `${MY_LISTINGS_PATH}?${query}`;
}

/** The last page that can hold a row, never below 1 (a `total` of 0 still has page 1). */
export const lastPageOf = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / pageSize));

/** Whether a listing in `status` belongs in the list of `filter`. */
export const matchesFilter = (
  filter: ListingFilter,
  status: ListingStatus,
): boolean => filter === "all" || filter === status;

/** The words of the list heading, which a screen reader hears again when the count changes. */
export function listHeading(filter: ListingFilter, total: number): string {
  const count = formatCount(total);
  switch (filter) {
    case "all":
      return `${count} tin`;
    case "visible":
      return `${count} tin đang hiện`;
    case "hidden_by_owner":
      return `${count} tin bạn đã ẩn`;
    case "hidden_by_admin":
      return `${count} tin admin đã ẩn`;
  }
}
