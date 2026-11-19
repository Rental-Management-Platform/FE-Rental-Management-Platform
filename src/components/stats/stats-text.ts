// The words every statistics screen shares (spec 0024 and 0025): loading, updating, retry, reset,
// the period before and the range written out. Pure: no React and no network. The words of one
// screen stay with that screen.
import type { StatisticsPeriod } from "@/lib/api/types";
import { formatDateOnly } from "@/lib/format";

export const LOADING_TEXT = "Đang tải thống kê";
export const UPDATING_TEXT = "Đang cập nhật số liệu";

export const RETRY_LABEL = "Thử lại";
export const RESET_RANGE_LABEL = "Dùng 30 ngày gần nhất";

type Days = Pick<StatisticsPeriod, "from" | "to">;

/** "21/10/2026 đến 19/11/2026": the range the answer holds, from its `period`. */
export const rangeText = ({ from, to }: Days) =>
  `${formatDateOnly(from)} đến ${formatDateOnly(to)}`;

/** "Kỳ trước: 96" under a number of a period. */
export const previousLine = (previous: string) => `Kỳ trước: ${previous}`;

/** The caption of the text table of the daily chart, naming the range. */
export const tableCaption = (period: Days) =>
  `Số liệu theo ngày từ ${rangeText(period)}`;
