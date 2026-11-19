import { listingLabel } from "@/features/admin-listings/admin-listings-text";
import { authorName } from "@/features/reviews/text";
import type { AdminListingReview, AdminReview, Uuid } from "@/lib/api/types";
import { SELECTED_AUTHOR, SELECTED_LISTING } from "./admin-reviews-text";

/**
 * What a row of both lists holds in common, so one table and one set of blocks can draw either
 * (scope #36). A landlord review (`AdminReview`) adds the landlord, a room review
 * (`AdminListingReview`) adds the listing, and each list draws that part itself.
 */
export type ReviewRow = Pick<
  AdminReview,
  | "id"
  | "status"
  | "stars"
  | "comment"
  | "hiddenReason"
  | "author"
  | "createdAt"
>;

/**
 * The name of the writer a filter is set to. The rows hold it (the API gives only a name, no email),
 * and when the filter leaves no row on the page, or the first read is still running, the page says
 * only that a writer is chosen. A writer who never set a name reads "Người dùng", as on the public
 * pages.
 */
export const filteredAuthorLabel = (
  rows: readonly ReviewRow[] | undefined,
  authorId: Uuid,
): string => {
  const row = rows?.find((candidate) => candidate.author.id === authorId);
  return row === undefined ? SELECTED_AUTHOR : authorName(row.author.name);
};

/**
 * The title of the listing a filter is set to, cut when it is long. Same idea as the writer: the
 * rows hold it, and when the filter leaves no row on the page, or the first read is still running,
 * the page says only that a listing is chosen.
 */
export const filteredListingTitle = (
  rows: readonly Pick<AdminListingReview, "listing">[] | undefined,
  listingId: Uuid,
): string => {
  const row = rows?.find((candidate) => candidate.listing.id === listingId);
  return row === undefined ? SELECTED_LISTING : listingLabel(row.listing);
};
