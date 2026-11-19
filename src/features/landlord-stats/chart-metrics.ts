// The four choices of the daily chart in one table (spec 0024, AC-8): the series key, the Metric
// whose `value` is the total in the chart's name, the tab label and the unit word of the tooltip.
// The shared chart and table take what they need from here as props, so adding a series is one
// row and the chart and table never disagree.
import type { Metric, Statistics, StatisticsDay } from "@/lib/api/types";

export type SeriesKey = Exclude<keyof StatisticsDay, "date">;

export interface ChartMetric {
  key: SeriesKey;
  /** The tab, and the name of the series in the chart. */
  tabLabel: string;
  /** The column of the text table. */
  columnLabel: string;
  /** The unit word of the tooltip: "16/11/2026: 70 lượt xem". */
  unit: string;
  /** The Metric that holds the total of the range for this series. Never a sum of the points. */
  metric: (statistics: Statistics) => Metric;
}

export const CHART_METRICS = [
  {
    key: "views",
    tabLabel: "Lượt xem",
    columnLabel: "Lượt xem",
    unit: "lượt xem",
    metric: (statistics) => statistics.views.inRange,
  },
  {
    key: "newFavorites",
    tabLabel: "Lượt lưu",
    columnLabel: "Lượt lưu mới",
    unit: "lượt lưu",
    metric: (statistics) => statistics.interest.newFavorites,
  },
  {
    key: "newFollowers",
    tabLabel: "Người theo dõi",
    columnLabel: "Người theo dõi mới",
    unit: "người theo dõi",
    metric: (statistics) => statistics.interest.newFollowers,
  },
  {
    key: "newConversations",
    tabLabel: "Cuộc trò chuyện",
    columnLabel: "Cuộc trò chuyện mới",
    unit: "cuộc trò chuyện",
    metric: (statistics) => statistics.chat.conversationsOpened,
  },
] as const satisfies readonly ChartMetric[];
