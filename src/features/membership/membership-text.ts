// What the status strip says about a membership (spec 0020, AC-2, AC-3 and AC-13). Pure: no
// React, no network, so the rules can be read and tested on their own. Nothing is computed here
// beyond joining text and formatting: every number is a field of the answer, and the only
// comparisons are `state`, `remaining` equal to 0, `overLimitCount` and `visibleCount` above 0,
// and `paidUntil` against `endsAt`.
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

/**
 * What to do when the limit is reached. The strip says it when there is no room, and the notice
 * of a refused "Hiện" says it after `LISTING_QUOTA_REACHED` (spec 0020, AC-3 and AC-8).
 */
export const QUOTA_HINT = "Hãy ẩn hoặc xóa bớt một tin, hoặc mua gói lớn hơn.";

const showing = ({ visibleCount, listingLimit }: Membership) =>
  `đang hiện ${formatCount(visibleCount)} trên ${formatCount(listingLimit)} tin`;

const sameMoment = (a: string, b: string) =>
  new Date(a).getTime() === new Date(b).getTime();

// A trial or a plan: `info` while there is room. With no room left, or listings cut back over
// the limit, it is a `warning` that says how many guests cannot see and what can be done.
const withLimit = (membership: Membership, headline: string): StripNotice => {
  const { remaining, overLimitCount } = membership;
  if (remaining !== 0 && overLimitCount <= 0) {
    return { tone: "info", headline, lines: [], action: null };
  }
  return {
    tone: "warning",
    headline,
    lines: [
      ...(overLimitCount > 0
        ? [
            `${formatCount(overLimitCount)} tin đang bị ẩn bớt khỏi khách vì vượt hạn mức`,
          ]
        : []),
      QUOTA_HINT,
    ],
    action: "pricing",
  };
};

/** Why a listing that is `visible` is still hidden from guests (spec 0020, AC-10). */
export type HoldBackCause = "trial-ended" | "over-limit";

/**
 * The cause from the shared answer: the trial ended with no plan, else more listings showing
 * than the limit. `null` when the answer is not loaded or neither holds, and the badge then keeps
 * its generic sentence.
 */
export function holdBackCause(
  membership: Membership | undefined,
): HoldBackCause | null {
  if (membership === undefined) return null;
  if (membership.state === "expired") return "trial-ended";
  return membership.overLimitCount > 0 ? "over-limit" : null;
}

/** The reason line of the badge for each cause. The label of the badge itself does not change. */
export const HOLD_BACK_LINE: Record<HoldBackCause, string> = {
  "trial-ended": "Khách chưa thấy tin này: bạn đã hết dùng thử và chưa có gói.",
  "over-limit": "Khách chưa thấy tin này: bạn đang hiện nhiều tin hơn hạn mức.",
};

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
      return withLimit(membership, `${days} · ${showing(membership)}`);
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
      return withLimit(membership, `${plan} · ${showing(membership)}`);
    }
    case "expired":
      return {
        tone: "warning",
        headline: "Bạn đã hết dùng thử và chưa có gói.",
        lines: [
          "Bạn chưa đăng tin mới hay hiện lại tin được. Ẩn, sửa và xóa tin vẫn dùng được.",
          // When expired, every listing that is showing is held back from guests (6.25).
          ...(membership.visibleCount > 0
            ? [
                `Khách chưa thấy ${formatCount(membership.visibleCount)} tin của bạn.`,
              ]
            : []),
        ],
        action: "buy",
      };
    default:
      return null;
  }
}
