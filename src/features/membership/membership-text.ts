// What the status strip says about a membership (spec 0020, AC-2, AC-3 and AC-13). Pure: no
// React, no network, so the rules can be read and tested on their own. Nothing is computed here
// beyond joining text and formatting: every number is a field of the answer, and the only
// comparisons are `state`, `paidUntil` against `endsAt`, and the checks of AC-13.
import type { Membership } from "@/lib/api/types";
import { formatCount, formatDateTime } from "@/lib/format";

/** `info` when there is room, `warning` when there is none, the listings are cut back, or it ended. */
export type StripTone = "info" | "warning";

/** The way out: a "Mua gói" button, or a "Xem bảng giá" link. Both go to `PRICING_PATH`. */
export type WayOut = "buy" | "pricing";

export interface StripNotice {
  tone: StripTone;
  /** The main sentence. */
  headline: string;
  /** What is said under it, one sentence each. */
  lines: readonly string[];
  action: WayOut | null;
}

const showing = ({ visibleCount, listingLimit }: Membership) =>
  `đang hiện ${formatCount(visibleCount)} trên ${formatCount(listingLimit)} tin`;

const sameMoment = (a: string, b: string) =>
  new Date(a).getTime() === new Date(b).getTime();

/**
 * The strip's text for one answer, or `null` when `state` is a value this version does not know
 * (the strip then draws nothing instead of guessing).
 */
export function describeMembership(membership: Membership): StripNotice | null {
  switch (membership.state) {
    case "trial": {
      const days =
        membership.trialDaysLeft === null
          ? "Đang dùng thử"
          : `Còn ${formatCount(membership.trialDaysLeft)} ngày dùng thử`;
      return {
        tone: "info",
        headline: `${days} · ${showing(membership)}`,
        lines: [],
        action: null,
      };
    }
    case "plan": {
      const { subscription } = membership;
      const plan =
        subscription === null
          ? "Đang dùng gói"
          : `Gói ${subscription.planName} đến hết ngày ${formatDateTime(subscription.endsAt)}${
              sameMoment(subscription.paidUntil, subscription.endsAt)
                ? ""
                : ` (đã trả đến ${formatDateTime(subscription.paidUntil)})`
            }`;
      return {
        tone: "info",
        headline: `${plan} · ${showing(membership)}`,
        lines: [],
        action: null,
      };
    }
    case "expired":
      return {
        tone: "warning",
        headline: "Bạn đã hết dùng thử và chưa có gói.",
        lines: [
          "Bạn chưa đăng tin mới hay hiện lại tin được. Ẩn, sửa và xóa tin vẫn dùng được.",
        ],
        action: "buy",
      };
    default:
      return null;
  }
}
