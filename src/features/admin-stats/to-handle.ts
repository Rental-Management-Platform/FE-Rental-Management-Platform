// The three rows of the "Cần xử lý" strip (spec 0025, AC-5). Pure: the rows are worked out from
// the `toHandle` block of the answer and the session, so the rule can be read without a screen.
import { ADMIN_TOOLS } from "@/components/shells/workspace-tools";
import {
  adminListingsHref,
  NO_MODERATION_FILTERS,
} from "@/features/admin-listings/moderation-filter";
import {
  adminReviewsHref,
  NO_LANDLORD_FILTERS,
  NO_LISTING_FILTERS,
} from "@/features/admin-reviews/review-filter";
import type { AdminOverview } from "@/lib/api/types";
import { can } from "@/lib/session/can";
import type { SessionState } from "@/lib/session/create-session";

type ToHandle = AdminOverview["toHandle"];

export interface ToHandleRow {
  key: keyof ToHandle;
  label: string;
  count: number;
  /**
   * The moderation list, already filtered to what admins hid. `null` when the count is 0 (there is
   * nothing to open) or the session lacks the permission of that tool (the count is plain text).
   */
  href: string | null;
}

// Each row names the `ADMIN_TOOLS` entry whose page it opens, so the permission is read from that
// entry and never typed again here. Both review rows belong to the one `reviews` tool.
const ROWS = [
  {
    key: "hiddenListings",
    label: "Tin đang bị quản trị viên ẩn",
    toolId: "moderation",
    href: () =>
      adminListingsHref(
        { ...NO_MODERATION_FILTERS, status: "hidden_by_admin" },
        1,
      ),
  },
  {
    key: "hiddenLandlordReviews",
    label: "Đánh giá chủ trọ đang bị ẩn",
    toolId: "reviews",
    href: () =>
      adminReviewsHref(
        { ...NO_LANDLORD_FILTERS, status: "hidden_by_admin" },
        1,
      ),
  },
  {
    key: "hiddenRoomReviews",
    label: "Đánh giá phòng đang bị ẩn",
    toolId: "reviews",
    // The room tab writes `?tab=listing`.
    href: () =>
      adminReviewsHref({ ...NO_LISTING_FILTERS, status: "hidden_by_admin" }, 1),
  },
] as const;

// Hiding a link is a convenience: the backend still decides what a person may do.
function mayOpen(toolId: string, session: SessionState): boolean {
  const tool = ADMIN_TOOLS.find((entry) => entry.id === toolId);
  if (tool === undefined) return false;
  return tool.permission === undefined || can(session, tool.permission);
}

/** The strip rows, in the order of the spec, each with its count and link (or none). */
export const toHandleRows = (
  toHandle: ToHandle,
  session: SessionState,
): ToHandleRow[] =>
  ROWS.map((row) => {
    const count = toHandle[row.key];
    return {
      key: row.key,
      label: row.label,
      count,
      href: count > 0 && mayOpen(row.toolId, session) ? row.href() : null,
    };
  });
