// The words of the landlord statistics screen (spec 0024). Pure: no React and no network. Nothing is
// worked out here beyond joining text and formatting: every number is a field of the answer.
import { rangeText } from "@/components/stats/stats-text";
import type {
  MembershipState,
  StatisticsPeriod,
  StatisticsTopListing,
} from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import type { ChartMetric } from "./chart-metrics";

export const STATS_TITLE = "Tổng quan";
export const STATS_DESCRIPTION =
  "Lượt xem, lượt lưu, người theo dõi và tin nhắn của tin đăng của bạn, so với kỳ trước.";

export const FORBIDDEN_MESSAGE =
  "Tài khoản của bạn chưa có quyền xem thống kê. Hãy liên hệ quản trị viên.";

/** Views by day only exist since the day the backend began to write them (api-for-frontend.md, 6.42). */
export const VIEWS_SINCE_NOTE = "Lượt xem theo ngày tính từ 16/11/2026.";

/** The badge of a top listing that guests cannot see, from its `status`; `null` when it is public. */
export function topListingBadge({
  status,
  isPublic,
}: Pick<StatisticsTopListing, "status" | "isPublic">): string | null {
  if (isPublic) return null;
  switch (status) {
    case "hidden_by_owner":
      return "Bạn đang ẩn";
    case "hidden_by_admin":
      return "Quản trị viên ẩn";
    case "visible":
      return "Chưa hiện công khai";
  }
}

/**
 * Why the held back row is held back, from `membership.state` (spec 0024, AC-11). `hiddenByQuota`
 * has two causes in one number (api-for-frontend.md, 6.42), so the state says which. Every state is
 * listed, so a new one fails the type check here, and a value the page does not know yet at run time
 * gets the neutral words.
 */
export function heldBackLabel(state: MembershipState): string {
  switch (state) {
    case "plan":
    case "trial":
      return "Ẩn bớt vì vượt hạn mức";
    case "expired":
      return "Ẩn vì hết dùng thử và chưa có gói";
    default: {
      const unknown: never = state;
      void unknown;
      return "Đang bị ẩn bớt";
    }
  }
}

export const LISTINGS_ZONE_TITLE = "Tin đăng và gói";
export const LISTINGS_PUBLIC_LABEL = "Đang hiện công khai";
export const LISTINGS_OWNER_LABEL = "Bạn tự ẩn";
export const LISTINGS_ADMIN_LABEL = "Quản trị viên ẩn";
export const MANAGE_LISTINGS_LABEL = "Quản lý tin";

/** "Tổng 17 tin". */
export const listingsTotalLine = (total: number) =>
  `Tổng ${formatCount(total)} tin`;

export const RATINGS_ZONE_TITLE = "Đánh giá";
export const LANDLORD_RATING_TITLE = "Điểm của bạn";
export const LANDLORD_RATING_NOTE = "Đánh giá trên hồ sơ của bạn";
export const ROOMS_RATING_TITLE = "Điểm của các phòng";
export const ROOMS_RATING_NOTE = "Đánh giá trên các tin của bạn";
export const NO_RATING_TEXT = "Chưa có đánh giá";
export const NEW_REVIEWS_LABEL = "Đánh giá mới";

/** "12 đánh giá". */
export const reviewCountLine = (count: number) =>
  `${formatCount(count)} đánh giá`;

export const CHAT_ZONE_TITLE = "Tin nhắn";
export const REPLY_RATE_LABEL = "Tỉ lệ trả lời";
export const REPLIED_LABEL = "Cuộc đã trả lời";
export const UNREAD_LABEL = "Chưa đọc";
export const NO_UNREAD_TEXT = "Không có tin chưa đọc";
export const OPEN_INBOX_LABEL = "Mở hộp thư";

/** "2 cuộc, 5 tin chưa đọc", or "Không có tin chưa đọc" when there is none. */
export const unreadLine = (conversations: number, messages: number) =>
  conversations === 0 && messages === 0
    ? NO_UNREAD_TEXT
    : `${formatCount(conversations)} cuộc, ${formatCount(messages)} tin chưa đọc`;

// The words "thanh toán thử" are in the heading, so every money figure of the zone sits under them.
export const SPENDING_ZONE_TITLE = "Chi tiêu (thanh toán thử)";
export const SPENT_LABEL = "Đã chi";
export const PAID_ORDERS_LABEL = "Đơn đã trả";
export const ORDER_HISTORY_LABEL = "Xem lịch sử đơn";

export const EMPTY_TITLE = "Bạn chưa có tin nào";
export const EMPTY_DESCRIPTION =
  "Thêm nhà trọ rồi đăng tin đầu tiên để xem lượt xem, lượt lưu và tin nhắn ở đây.";
export const ADD_PROPERTY_LABEL = "Thêm nhà trọ";
export const POST_LISTING_LABEL = "Đăng tin";

export const TOP_LISTINGS_TITLE = "Tin xem nhiều nhất";
export const TOP_LISTINGS_EMPTY =
  "Chưa có tin nào có lượt xem trong khoảng này";

/** "Tổng từ trước đến nay: 1.450", with no arrow, under a number of a period. */
export const totalLine = (total: string) => `Tổng từ trước đến nay: ${total}`;

/** What a screen reader hears for the chart: what it shows, the range, and the total of the Metric. */
export const chartLabel = (
  metric: ChartMetric,
  period: StatisticsPeriod,
  total: number,
) =>
  `${metric.tabLabel} theo ngày từ ${rangeText(period)}, tổng ${formatCount(total)} ${metric.unit}`;
