// Which button a row of the review moderation table offers (scope #36). Pure: no React, no session.

import type { ReviewStatus } from "@/lib/api/types";

export type ReviewAction = "hide" | "unhide";

/**
 * One rule for every row of both lists, from the contract (api-for-frontend.md 6.40 and 6.41):
 * - a review an admin hid offers "Gỡ ẩn" and nothing else (a second hide is a 409);
 * - a review that shows offers "Ẩn" and nothing else (an unhide of a review that shows is a 409).
 * A review has two states only, so a row never offers both. Both buttons need `review:moderate`,
 * which is also what the page needs to read the lists, so the page does not draw a row without it.
 * Hiding a button is a convenience: the backend decides.
 */
export const reviewActionOf = (status: ReviewStatus): ReviewAction =>
  status === "hidden_by_admin" ? "unhide" : "hide";
