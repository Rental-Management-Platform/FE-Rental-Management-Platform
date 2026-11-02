// The words of each dashboard number (spec 0008, "Value sourcing"). Pure: no React, no network,
// so the rules can be read and tested on their own. Nothing is computed here beyond joining text
// and formatting; every figure is a field or a `total` the backend returned.
import type { StatKey, Tool } from "@/components/shells/workspace-tools";
import type { Membership } from "@/lib/api/types";
import { formatCount, formatMoney } from "@/lib/format";
import type { CountSource, SourceValue } from "./api/stats";

const totalOf = (
  values: readonly SourceValue[],
  source: CountSource,
): number | undefined => {
  const found = values.find((value) => value.source === source);
  return found !== undefined && "total" in found ? found.total : undefined;
};

const membershipOf = (
  values: readonly SourceValue[],
): Membership | undefined => {
  const found = values.find((value) => value.source === "membership");
  return found?.source === "membership" ? found.membership : undefined;
};

const revenueOf = (values: readonly SourceValue[]) => {
  const found = values.find((value) => value.source === "revenue");
  return found?.source === "revenue" ? found : undefined;
};

/** "Đã có 3 nhà trọ", or "Chưa có nhà trọ nào" when there is none. */
const propertyCountLines = (values: readonly SourceValue[]): string[] => {
  const total = totalOf(values, "properties");
  if (total === undefined) return [];
  return [
    total > 0 ? `Đã có ${formatCount(total)} nhà trọ` : "Chưa có nhà trọ nào",
  ];
};

/** How many listings the landlord can still post. */
const quotaLines = (values: readonly SourceValue[]): string[] => {
  const membership = membershipOf(values);
  if (membership === undefined) return [];
  if (membership.state === "expired") {
    return ["Hết dùng thử, cần mua gói để đăng tin"];
  }
  return [
    membership.remaining > 0
      ? `Còn đăng được ${formatCount(membership.remaining)} tin`
      : `Đã dùng hết hạn mức ${formatCount(membership.listingLimit)} tin`,
  ];
};

/**
 * The listings showing against the limit, then the alerts: listings cut back over the limit,
 * and listings an admin hid. An alert line shows only when its number is above 0. Each line
 * needs its own source, so a person who may read only one of them still sees that line.
 */
const myListingsLines = (values: readonly SourceValue[]): string[] => {
  const membership = membershipOf(values);
  const hiddenByAdmin = totalOf(values, "hiddenByAdmin");
  return [
    ...(membership === undefined
      ? []
      : [
          membership.state === "expired"
            ? "Hết dùng thử"
            : `Đang hiện ${formatCount(membership.visibleCount)} trên ${formatCount(membership.listingLimit)} tin`,
        ]),
    ...(membership !== undefined && membership.overLimitCount > 0
      ? [
          `${formatCount(membership.overLimitCount)} tin đang bị ẩn bớt vì vượt hạn mức`,
        ]
      : []),
    ...(hiddenByAdmin !== undefined && hiddenByAdmin > 0
      ? [`${formatCount(hiddenByAdmin)} tin bị quản trị viên ẩn`]
      : []),
  ];
};

/** The plan in use, the trial, or the end of the trial. */
const planLines = (values: readonly SourceValue[]): string[] => {
  const membership = membershipOf(values);
  if (membership === undefined) return [];
  switch (membership.state) {
    case "plan":
      return [
        membership.subscription === null
          ? "Đang dùng gói"
          : `Gói ${membership.subscription.planName}, còn ${formatCount(membership.subscription.daysLeft)} ngày`,
      ];
    case "trial":
      return [
        membership.trialDaysLeft === null
          ? "Đang dùng thử"
          : `Dùng thử, còn ${formatCount(membership.trialDaysLeft)} ngày`,
      ];
    case "expired":
      return ["Hết dùng thử, chưa có gói"];
  }
};

/** The listings an admin hid, of every landlord. */
const hiddenListingsLines = (values: readonly SourceValue[]): string[] => {
  const hidden = totalOf(values, "moderation");
  if (hidden === undefined) return [];
  return [
    hidden > 0
      ? `${formatCount(hidden)} tin đang bị ẩn`
      : "Không có tin nào đang bị ẩn",
  ];
};

/** The accounts, then how many of them are locked. */
const usersLines = (values: readonly SourceValue[]): string[] => {
  const users = totalOf(values, "users");
  const locked = totalOf(values, "lockedUsers");
  return [
    ...(users === undefined ? [] : [`${formatCount(users)} tài khoản`]),
    ...(locked === undefined
      ? []
      : [
          locked > 0
            ? `${formatCount(locked)} đang bị khóa`
            : "Không có tài khoản bị khóa",
        ]),
  ];
};

// The payments of this product are test payments, so every money figure says so (spec 0008).
const TEST_PAYMENT = "(thanh toán thử)";

/** The paid orders of every landlord. */
const paidOrdersLines = (values: readonly SourceValue[]): string[] => {
  const revenue = revenueOf(values);
  return revenue === undefined
    ? []
    : [`${formatCount(revenue.paidCount)} đơn đã trả ${TEST_PAYMENT}`];
};

/** The amount of every paid order, with no date range. */
const revenueLines = (values: readonly SourceValue[]): string[] => {
  const revenue = revenueOf(values);
  return revenue === undefined
    ? []
    : [`${formatMoney(revenue.paidAmount)} ${TEST_PAYMENT}`];
};

/** The lines under a card's description. Empty when none of its sources is known. */
export function describeStat(
  stat: StatKey,
  values: readonly SourceValue[],
): string[] {
  switch (stat) {
    case "propertyCount":
      return propertyCountLines(values);
    case "quota":
      return quotaLines(values);
    case "myListings":
      return myListingsLines(values);
    case "plan":
      return planLines(values);
    case "hiddenListings":
      return hiddenListingsLines(values);
    case "users":
      return usersLines(values);
    case "paidOrders":
      return paidOrdersLines(values);
    case "revenue":
      return revenueLines(values);
  }
}

/**
 * The "Bắt đầu từ đây" highlight (spec 0008, AC-11): on "Thêm nhà trọ" only, when it opens and
 * the landlord has no property yet. It needs no request of its own, the count is the one the
 * card already shows. A count that failed or is not known yet never highlights.
 */
export const isFirstStep = (
  tool: Tool,
  values: readonly SourceValue[],
): boolean =>
  tool.id === "property.create" &&
  tool.status === "ready" &&
  totalOf(values, "properties") === 0;
