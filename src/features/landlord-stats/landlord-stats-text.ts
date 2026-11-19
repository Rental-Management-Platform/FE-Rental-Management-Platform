// The words of the landlord statistics screen (spec 0024). Pure: no React and no network. Nothing is
// worked out here beyond joining text and formatting: every number is a field of the answer.
import type { StatisticsPeriod } from "@/lib/api/types";
import { formatCount, formatDateOnly } from "@/lib/format";
import type { ChartMetric } from "./chart-metrics";

export const STATS_TITLE = "Tổng quan";
export const STATS_DESCRIPTION =
  "Lượt xem, lượt lưu, người theo dõi và tin nhắn của tin đăng của bạn, so với kỳ trước.";

export const FORBIDDEN_MESSAGE =
  "Tài khoản của bạn chưa có quyền xem thống kê. Hãy liên hệ quản trị viên.";

/** Said once an answer is on screen and the range ends today, because today is only part done. */
export const PARTIAL_DAY_NOTE =
  "Hôm nay mới qua một phần nên kỳ này có thể thấp hơn kỳ trước.";

/** Views by day only exist since the day the backend began to write them (api-for-frontend.md, 6.42). */
export const VIEWS_SINCE_NOTE = "Lượt xem theo ngày tính từ 16/11/2026.";

export const LOADING_TEXT = "Đang tải thống kê";
export const UPDATING_TEXT = "Đang cập nhật số liệu";

const range = (from: string, to: string) =>
  `${formatDateOnly(from)} đến ${formatDateOnly(to)}`;

/** "21/10/2026 đến 19/11/2026 (30 ngày), so với 21/09/2026 đến 20/10/2026". */
export const periodCaption = ({
  from,
  to,
  days,
  previousFrom,
  previousTo,
}: StatisticsPeriod) =>
  `${range(from, to)} (${formatCount(days)} ngày), so với ${range(previousFrom, previousTo)}`;

/** "Kỳ trước: 96" under a number of a period. */
export const previousLine = (previous: string) => `Kỳ trước: ${previous}`;

/** "Tổng từ trước đến nay: 1.450", with no arrow, under a number of a period. */
export const totalLine = (total: string) => `Tổng từ trước đến nay: ${total}`;

/** The caption of the text table, naming the range. */
export const tableCaption = ({ from, to }: StatisticsPeriod) =>
  `Số liệu theo ngày từ ${range(from, to)}`;

/** What a screen reader hears for the chart: what it shows, the range, and the total of the Metric. */
export const chartLabel = (
  metric: ChartMetric,
  { from, to }: StatisticsPeriod,
  total: number,
) =>
  `${metric.tabLabel} theo ngày từ ${range(from, to)}, tổng ${formatCount(total)} ${metric.unit}`;
