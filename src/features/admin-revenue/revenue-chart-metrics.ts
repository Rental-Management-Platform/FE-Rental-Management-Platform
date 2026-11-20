// The two tabs of the revenue chart in one table (spec 0026, AC-7 and AC-9): the series field of
// each, its name, the column of the text table, the unit word of the tooltip, the least its axis
// reaches and the width the axis needs for its numbers. The chart, the table and the accessible
// name all take what they need from here, so they never disagree. The two tabs are never drawn on
// one scale: money and a count of orders have nothing in common.
import type { SeriesColumn } from "@/components/stats/series-table";
import type { TrendPoint } from "@/components/stats/trend-lines";
import type { RevenueResponse } from "@/lib/api/types";
import { formatCount, formatMoney } from "@/lib/format";
import type { FilledPeriod } from "./fill-series";

export type RevenueKey = "paidAmount" | "paidCount";

export interface RevenueTab {
  id: "amount" | "count";
  /** The tab, and the start of the chart's accessible name. */
  label: string;
  /** The field of a period that holds this tab's number. */
  key: RevenueKey;
  /** The unit word of the tooltip: "16/11/2026: 3 đơn", "16/11/2026: 398.000 ₫". */
  unit: string;
  /** The Y axis never ends below this, so a range of zeros reads cleanly. */
  yFloor: number;
  /** The width of the Y axis: money is written in full ("1.500.000"), so it needs more room. */
  yAxisWidth: number;
  /** The total of the answer as the accessible name says it: `paidAmount` or `paidCount`, never a sum. */
  total: (answer: RevenueResponse) => string;
}

export const REVENUE_TABS = [
  {
    id: "amount",
    label: "Doanh thu",
    key: "paidAmount",
    unit: "₫",
    yFloor: 100_000,
    yAxisWidth: 84,
    total: ({ paidAmount }) => `${formatMoney(paidAmount)} (thanh toán thử)`,
  },
  {
    id: "count",
    label: "Đơn đã trả",
    key: "paidCount",
    unit: "đơn",
    yFloor: 4,
    yAxisWidth: 44,
    total: ({ paidCount }) => `${formatCount(paidCount)} đơn`,
  },
] as const satisfies readonly RevenueTab[];

export type RevenueTabId = (typeof REVENUE_TABS)[number]["id"];

/** The first tab, chosen when the zone mounts. */
export const FIRST_TAB: RevenueTabId = REVENUE_TABS[0].id;

export const isTabId = (value: string): value is RevenueTabId =>
  REVENUE_TABS.some((tab) => tab.id === value);

/** The columns of the text table: both, whichever tab is chosen. */
export const REVENUE_COLUMNS: readonly SeriesColumn<RevenueKey>[] = [
  { key: "paidAmount", label: "Doanh thu", format: formatMoney },
  { key: "paidCount", label: "Đơn đã trả" },
];

/** The points of the chart for one tab: the date and the one number of that tab. */
export const tabPoints = (
  tab: RevenueTab,
  periods: readonly FilledPeriod[],
): TrendPoint[] =>
  periods.map((period) => ({ date: period.date, [tab.key]: period[tab.key] }));
