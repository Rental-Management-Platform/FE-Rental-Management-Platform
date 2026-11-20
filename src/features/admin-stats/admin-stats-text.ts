// The words of the admin overview screen (spec 0025). Pure: no React and no network. Nothing is
// worked out here beyond joining text and formatting: every number is a field of the answer. The
// words every statistics screen shares are in `src/components/stats/stats-text.ts`.
import { rangeText } from "@/components/stats/stats-text";
import type { AdminOverview } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import type { AdminChartTab } from "./admin-chart-metrics";

export const STATS_TITLE = "Tổng quan";
export const STATS_DESCRIPTION =
  "Số liệu của cả nền tảng: việc cần xử lý, trạng thái hiện tại và biến động theo khoảng ngày.";

export const FORBIDDEN_MESSAGE =
  "Tài khoản của bạn chưa có quyền xem tổng quan.";
export const ERROR_TITLE = "Không tải được tổng quan";

/** Views by day only exist since the day the backend began to write them (api-for-frontend.md, 6.43). */
export const VIEWS_SINCE_NOTE = "Lượt xem theo ngày tính từ 16/11/2026.";

// The two groups of number cards under the range bar (AC-9).
export const REGISTRATION_GROUP_TITLE = "Đăng ký và tin mới";
export const ENGAGEMENT_GROUP_TITLE = "Mức quan tâm";
/** These numbers count by other rules than a landlord's own, so the page says so once (api-for-frontend.md, 6.43). */
export const ENGAGEMENT_GROUP_NOTE =
  "Mọi số ở đây tính cả dòng đang bị ẩn hoặc của tài khoản bị khóa.";

// The daily chart (AC-10 and AC-11).
export const DAILY_ZONE_TITLE = "Theo ngày";
export const CHART_TABS_LABEL = "Số liệu của biểu đồ";
export const OPEN_TABLE_LABEL = "Xem bảng số liệu";

/**
 * What a screen reader hears for the chart of a tab: what it shows, the range, then the total of
 * each line, which is the `value` of its Metric and never a sum of the points. A tab with one
 * line says "tổng" once, since the line is the tab; a tab with two names each line:
 * "Người dùng mới theo ngày từ 21/10/2026 đến 19/11/2026, Chủ trọ tổng 7 chủ trọ mới, Người tìm
 * trọ tổng 38 người tìm trọ mới".
 */
export const chartLabel = (tab: AdminChartTab, overview: AdminOverview) => {
  const totals = tab.lines.map((line) => {
    const total = `tổng ${formatCount(line.metric(overview).value)} ${line.unit}`;
    return tab.lines.length === 1 ? total : `${line.name} ${total}`;
  });
  return [
    `${tab.label} theo ngày từ ${rangeText(overview.period)}`,
    ...totals,
  ].join(", ");
};

// New listings by ward (AC-12).
export const WARDS_ZONE_TITLE = "Tin mới theo phường";
export const WARDS_EMPTY_TEXT = "Chưa có tin mới nào trong khoảng này";
export const WARDS_OPEN_LABEL = "Xem tất cả";
export const WARDS_TABLE_LABEL = "Bảng tin mới theo phường";
export const WARDS_WARD_HEADER = "Phường";
export const WARDS_COUNT_HEADER = "Tin mới";

/** "và 158 phường khác": a count of rows, which adds no counts. */
export const moreWardsLine = (rest: number) =>
  `và ${formatCount(rest)} phường khác`;

/** The caption of the full ward table, naming the range. */
export const wardsTableCaption = (period: AdminOverview["period"]) =>
  `Tin mới theo phường từ ${rangeText(period)}`;

// The strip at the top (AC-5).
export const TO_HANDLE_TITLE = "Cần xử lý";
export const NONE_TEXT = "Không có";
export const ALL_CLEAR_TEXT = "Không có gì cần xử lý";

// The three zones of the state of the platform now, above the range bar (AC-6, AC-7 and AC-8).
// Numbers of the moment: they have no arrow and do not change with the range.
export const ACCOUNTS_ZONE_TITLE = "Tài khoản";
export const ACCOUNTS_TOTAL_LABEL = "Tổng";
export const ACCOUNT_ADMIN_LABEL = "Quản trị viên";
export const ACCOUNT_LANDLORD_LABEL = "Chủ trọ";
export const ACCOUNT_TENANT_LABEL = "Người tìm trọ";

/** The quiet line under an account count: "12 đang hoạt động, 1 bị khóa". Both are fields of the answer. */
export const accountsQuietLine = (active: number, locked: number) =>
  `${formatCount(active)} đang hoạt động, ${formatCount(locked)} bị khóa`;

export const LANDLORDS_ZONE_TITLE = "Chủ trọ";
export const LANDLORD_ON_PLAN_LABEL = "Đang có gói";
export const LANDLORD_ON_TRIAL_LABEL = "Đang dùng thử";
export const LANDLORD_TRIAL_EXPIRED_LABEL = "Hết dùng thử, chưa có gói";
export const landlordsTotalLine = (total: number) =>
  `Tổng ${formatCount(total)} chủ trọ`;

export const LISTINGS_ZONE_TITLE = "Tin đăng";
export const LISTING_PUBLIC_LABEL = "Đang hiện công khai";
export const LISTING_NOT_PUBLIC_LABEL = "Hiện nhưng khách không thấy";
/** Why a listing can be visible yet not public (api-for-frontend.md, 6.43). */
export const LISTING_NOT_PUBLIC_NOTE =
  "Chủ trọ bị khóa, hết dùng thử và hết gói, hoặc vượt hạn mức.";
export const LISTING_OWNER_HIDDEN_LABEL = "Chủ trọ ẩn";
export const LISTING_ADMIN_HIDDEN_LABEL = "Quản trị viên ẩn";
export const listingsTotalLine = (total: number) =>
  `Tổng ${formatCount(total)} tin`;
