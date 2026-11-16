// The fixed copy of the order page and the history (spec 0022). Every sentence here is Vietnamese.
// Nothing about a plan is written here: the name, the price, the limit and the days come from the
// order itself, which keeps a fixed copy of the plan as it was when the order was made.

import { formatDateTime, formatMoney } from "@/lib/format";
import type { IsoDateTime, Order, OrderStatus } from "@/lib/api/types";

/** The tab title of the order page, and the current step of its breadcrumb. */
export const ORDER_PAGE_TITLE = "Đơn mua gói";

/** The history, as the link back from an order and the label of the dashboard tool. */
export const ORDERS_CRUMB = "Gói và đơn của tôi";

/** The `h1` of the order page by the status of the order (AC-3). */
export const ORDER_HEADING: Record<OrderStatus, string> = {
  pending: "Xác nhận đơn",
  paid: "Đơn đã thanh toán",
  cancelled: "Đơn đã hủy",
};

/** The line under the `h1`, by status. */
export const ORDER_DESCRIPTION: Record<OrderStatus, string> = {
  pending: "Kiểm tra gói rồi xác nhận bằng thanh toán thử.",
  paid: "Gói của bạn đã bắt đầu, bạn đăng tin được ngay.",
  cancelled: "Đơn này đã hủy và không thể thanh toán nữa.",
};

/** The words of a status badge (the icon is chosen next to it). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

export const SUMMARY_TITLE = "Gói trong đơn";

export const limitLine = (maxListings: number) =>
  `Hiện cùng lúc tối đa ${maxListings} tin`;

export const periodLine = (durationDays: number) => `mỗi ${durationDays} ngày`;

/** The price of the order and its period as one phrase: "199.000 ₫ mỗi 30 ngày". */
export const priceLine = ({
  price,
  durationDays,
}: Pick<Order, "price" | "durationDays">) =>
  `${formatMoney(price)} ${periodLine(durationDays)}`;

export const CODE_LABEL = "Mã đơn";

export const CREATED_LABEL = "Ngày tạo đơn";

export const PAYMENT_TITLE = "Thanh toán";

/** Said before the press, on every pending order (AC-4). */
export const TEST_PAYMENT_NOTE = "Đây là thanh toán thử, không có tiền thật.";

export const PAY = "Thanh toán thử";

export const PAYING = "Đang thanh toán";

/** For a person who may neither pay nor cancel (AC-8): no button, and this line. */
export const CANNOT_PAY_NOTE =
  "Tài khoản này không thể thanh toán hay hủy đơn.";

export const RESULT_TITLE = "Kết quả";

export const paidAtLine = (paidAt: IsoDateTime) =>
  `Thanh toán lúc ${formatDateTime(paidAt)}`;

export const periodRangeLine = (startsAt: IsoDateTime, endsAt: IsoDateTime) =>
  `Kỳ gói: từ ${formatDateTime(startsAt)} đến hết ${formatDateTime(endsAt)}`;

export const cancelledAtLine = (cancelledAt: IsoDateTime) =>
  `Đã hủy lúc ${formatDateTime(cancelledAt)}`;

export const MY_LISTINGS_LINK = "Xem tin của tôi";

export const NEW_LISTING_LINK = "Đăng tin mới";

export const PRICING_LINK = "Xem bảng giá";

export const BACK_TO_ORDERS = "Về lịch sử đơn";

export const ORDER_NOT_FOUND_TITLE = "Không tìm thấy đơn";

export const ORDER_FORBIDDEN_MESSAGE = "Bạn không có quyền xem đơn mua gói.";

export const ORDER_LOAD_FAILED_TITLE = "Không tải được đơn";
