// Which button a row of the moderation table offers (scope #21). Pure: no React, no session.

import type { ListingStatus } from "@/lib/api/types";

export type ModerationAction = "hide" | "unhide";

/**
 * One rule for every row, from the contract (api-for-frontend.md 6.29, the table of states):
 * - a listing an admin hid offers "Gỡ ẩn" and nothing else (a second hide is a 409);
 * - a `visible` listing and one the landlord hid both offer "Ẩn", because a hide takes either
 *   source state and the admin always wins over the landlord.
 * Both buttons need `listing:moderate`, which is also what the page needs to read the list, so the
 * page does not draw a row without it. Hiding a button is a convenience: the backend decides.
 */
export const moderationActionOf = (status: ListingStatus): ModerationAction =>
  status === "hidden_by_admin" ? "unhide" : "hide";
