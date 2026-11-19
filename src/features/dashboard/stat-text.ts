// The words of each dashboard number (spec 0008, "Value sourcing"). Pure: no React, no network,
// so the rules can be read and tested on their own. Nothing is computed here beyond joining text
// and formatting; every figure is a field or a `total` the backend returned. Only the admin cards
// have a number now (the landlord overview is the statistics screen of spec 0024).
import type { StatKey } from "@/components/shells/workspace-tools";
import { formatCount, formatMoney } from "@/lib/format";
import type { CountSource, SourceValue } from "./api/stats";

const totalOf = (
  values: readonly SourceValue[],
  source: CountSource,
): number | undefined => {
  const found = values.find((value) => value.source === source);
  return found !== undefined && "total" in found ? found.total : undefined;
};

const revenueOf = (values: readonly SourceValue[]) => {
  const found = values.find((value) => value.source === "revenue");
  return found?.source === "revenue" ? found : undefined;
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
