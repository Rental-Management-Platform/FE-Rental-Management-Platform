// The words of the revenue page (spec 0026). Pure: no React and no network. Nothing is worked out
// here beyond joining text and formatting: every number is a field of the answer. The words every
// statistics screen shares are in `src/components/stats/stats-text.ts`. Every zone that shows money
// ends its title with "(thanh toán thử)", because `paid` only means the landlord pressed confirm.
import { rangeText } from "@/components/stats/stats-text";
import type { RevenueResponse } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import type { RevenueTab } from "./revenue-chart-metrics";
import type { GroupBy, RevenueRequest } from "./revenue-view";

export const REVENUE_TITLE = "Doanh thu";
export const REVENUE_DESCRIPTION =
  "Tiền của các đơn đã trả, tính theo ngày trả. Đây là thanh toán thử, không phải doanh thu thật.";

export const FORBIDDEN_MESSAGE =
  "Tài khoản của bạn chưa có quyền xem doanh thu.";
export const ERROR_TITLE = "Không tải được doanh thu";

// The two totals (AC-5).
export const TOTALS_TITLE = "Tổng trong khoảng (thanh toán thử)";
export const REVENUE_CARD_LABEL = "Doanh thu (thanh toán thử)";
export const PAID_COUNT_LABEL = "Đơn đã trả";
/** Said once under the cards: the two screens filter by different dates, so the totals can differ. */
export const DATE_NOTE =
  "Tổng tính theo ngày trả. Màn Đơn của mọi chủ trọ lọc theo ngày tạo đơn, nên cùng một khoảng ngày hai tổng có thể khác nhau.";

/** The word for one period: by day or by month. */
export const grainWord = (groupBy: GroupBy) =>
  groupBy === "month" ? "tháng" : "ngày";

// The chart zone (AC-7 and AC-9).
export const chartZoneTitle = (groupBy: GroupBy) =>
  `Doanh thu theo ${grainWord(groupBy)} (thanh toán thử)`;
export const CHART_TABS_LABEL = "Số liệu của biểu đồ";
export const OPEN_TABLE_LABEL = "Xem bảng số liệu";
export const TOTAL_ROW_LABEL = "Tổng";
/** The first and the last month hold only the days inside the range, so the page says so once. */
export const MONTH_NOTE =
  "Tháng đầu và tháng cuối chỉ tính các ngày trong khoảng đã chọn.";

// The grouping switch (AC-3).
export const GROUP_SWITCH_LABEL = "Cách gom số liệu";
export const BY_DAY_LABEL = "Theo ngày";
export const BY_MONTH_LABEL = "Theo tháng";

// The list by plan (AC-10).
export const PLANS_ZONE_TITLE = "Doanh thu theo gói (thanh toán thử)";
export const PLANS_EMPTY_TEXT = "Chưa có đơn nào được trả trong khoảng này";
/** "20 đơn": the quiet line of a plan row and of its "Tổng" row. */
export const ordersLine = (count: number) => `${formatCount(count)} đơn`;

/**
 * What a screen reader hears for the chart of a tab: what it shows, the range, then the total of
 * the answer (`paidAmount` or `paidCount`, never a sum of the points):
 * "Doanh thu theo ngày từ 01/10/2026 đến 31/10/2026, tổng 5.970.000 ₫ (thanh toán thử)".
 */
export const chartLabel = (
  tab: RevenueTab,
  view: RevenueRequest,
  answer: RevenueResponse,
) =>
  `${tab.label} theo ${grainWord(view.groupBy)} từ ${rangeText(view)}, tổng ${tab.total(answer)}`;

/** The caption of the text table, naming the range and the kind of money. */
export const tableCaption = (view: RevenueRequest) =>
  `Doanh thu theo ${grainWord(view.groupBy)} từ ${rangeText(view)} (thanh toán thử)`;
