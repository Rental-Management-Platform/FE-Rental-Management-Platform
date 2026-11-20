// The six tabs of the daily chart in one table (spec 0025, AC-10): the tab, its one or two lines,
// the series field of each line, the Metric whose `value` is that line's total in the chart's name,
// the unit word of the tooltip and the column of the text table. The chart, the legend, the table
// and the accessible name all take what they need from here, so they never disagree, and a new
// line is one row.
import type { TrendPoint } from "@/components/stats/trend-lines";
import type { AdminOverview, AdminOverviewDay, Metric } from "@/lib/api/types";

export type SeriesKey = Exclude<keyof AdminOverviewDay, "date">;

export interface AdminChartLine {
  /** The field of a day of `series`. */
  key: SeriesKey;
  /** The name of the line, in the legend, the tooltip and the accessible name. */
  name: string;
  /** The column of the text table. */
  columnLabel: string;
  /** The unit word of the tooltip and the accessible name: "7 chủ trọ mới". */
  unit: string;
  /** The Metric that holds the total of the range for this line. Never a sum of the points. */
  metric: (overview: AdminOverview) => Metric;
}

export interface AdminChartTab {
  id: string;
  /** The tab, and the start of the chart's accessible name. */
  label: string;
  /** One or two lines. The first is drawn solid, the second dashed. */
  lines: readonly [AdminChartLine] | readonly [AdminChartLine, AdminChartLine];
}

export const ADMIN_CHART_TABS = [
  {
    id: "users",
    label: "Người dùng mới",
    lines: [
      {
        key: "newLandlords",
        name: "Chủ trọ",
        columnLabel: "Chủ trọ mới",
        unit: "chủ trọ mới",
        metric: ({ accounts }) => accounts.registered.landlords,
      },
      {
        key: "newTenants",
        name: "Người tìm trọ",
        columnLabel: "Người tìm trọ mới",
        unit: "người tìm trọ mới",
        metric: ({ accounts }) => accounts.registered.tenants,
      },
    ],
  },
  {
    id: "listings",
    label: "Tin mới",
    lines: [
      {
        key: "newListings",
        name: "Tin mới",
        columnLabel: "Tin mới",
        unit: "tin mới",
        metric: ({ listings }) => listings.created,
      },
    ],
  },
  {
    id: "views",
    label: "Lượt xem",
    lines: [
      {
        key: "views",
        name: "Lượt xem",
        columnLabel: "Lượt xem",
        unit: "lượt xem",
        metric: ({ engagement }) => engagement.views,
      },
    ],
  },
  {
    id: "chat",
    label: "Trò chuyện",
    lines: [
      {
        key: "newConversations",
        name: "Cuộc trò chuyện",
        columnLabel: "Cuộc trò chuyện mới",
        unit: "cuộc trò chuyện",
        metric: ({ engagement }) => engagement.conversations,
      },
      {
        key: "newMessages",
        name: "Tin nhắn",
        columnLabel: "Tin nhắn mới",
        unit: "tin nhắn",
        metric: ({ engagement }) => engagement.messages,
      },
    ],
  },
  {
    id: "reviews",
    label: "Đánh giá",
    lines: [
      {
        key: "newLandlordReviews",
        name: "Về chủ trọ",
        columnLabel: "Đánh giá chủ trọ mới",
        unit: "đánh giá chủ trọ",
        metric: ({ engagement }) => engagement.landlordReviews,
      },
      {
        key: "newRoomReviews",
        name: "Về phòng",
        columnLabel: "Đánh giá phòng mới",
        unit: "đánh giá phòng",
        metric: ({ engagement }) => engagement.roomReviews,
      },
    ],
  },
  {
    id: "interest",
    label: "Quan tâm",
    lines: [
      {
        key: "newFollows",
        name: "Theo dõi",
        columnLabel: "Lượt theo dõi mới",
        unit: "lượt theo dõi",
        metric: ({ engagement }) => engagement.follows,
      },
      {
        key: "newFavorites",
        name: "Lưu",
        columnLabel: "Lượt lưu mới",
        unit: "lượt lưu",
        metric: ({ engagement }) => engagement.favorites,
      },
    ],
  },
] as const satisfies readonly AdminChartTab[];

export type AdminChartTabId = (typeof ADMIN_CHART_TABS)[number]["id"];

/** The first tab, chosen when the zone mounts. */
export const FIRST_TAB: AdminChartTabId = ADMIN_CHART_TABS[0].id;

export const isTabId = (value: string): value is AdminChartTabId =>
  ADMIN_CHART_TABS.some((tab) => tab.id === value);

/** The days of the chart for one tab: the date and the number of each of its lines. */
export const tabPoints = (
  tab: AdminChartTab,
  series: readonly AdminOverviewDay[],
): TrendPoint[] =>
  series.map((day) => ({
    date: day.date,
    ...Object.fromEntries(tab.lines.map((line) => [line.key, day[line.key]])),
  }));
