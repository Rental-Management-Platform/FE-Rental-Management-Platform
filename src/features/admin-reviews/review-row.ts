import type { AdminReview } from "@/lib/api/types";

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
