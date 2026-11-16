// The fixed copy of the pricing page (spec 0021). Every sentence here is Vietnamese. Nothing about
// a plan is written here: names, prices and limits come from `GET /plans`.

import { formatMoney } from "@/lib/format";

export const PRICING_TITLE = "Bảng giá gói đăng tin";

export const PRICING_DESCRIPTION =
  "Chọn gói theo số tin bạn cần hiện cùng lúc. Giá tính cho một kỳ, và thanh toán chỉ là thanh toán thử.";

/** The three points under the price of a card, from the numbers of the plan. */
export const planPoints = (plan: {
  maxListings: number;
  durationDays: number;
}) =>
  [
    `Hiện cùng lúc tối đa ${plan.maxListings} tin`,
    `Mỗi kỳ ${plan.durationDays} ngày`,
    "Tin hiện lại với khách ngay khi thanh toán xong",
  ] as const;

export const SIGN_IN_TO_BUY = "Đăng nhập để mua";

export const buyLabel = (planName: string) => `Mua gói ${planName}`;

export const BUYING = "Đang tạo đơn";

/** Added after the backend's sentence when the plan is gone (`PLAN_INACTIVE`, `PLAN_NOT_FOUND`). */
export const CHOOSE_ANOTHER_PLAN = "Hãy chọn gói khác.";

/** Under the status strip while a plan is running: a plan bought now joins after it (AC-6). */
export const RENEWAL_LINE =
  "Gói mua thêm nối vào cuối kỳ hiện tại, không đổi gói ngay.";

/**
 * The reminder of an unpaid order (AC-7). The plan and the price are the order's own fields (the
 * copy fixed when the order was made), never looked up again.
 */
export const pendingOrderMessage = (order: {
  planName: string;
  price: number;
}) =>
  `Bạn có một đơn chờ thanh toán: gói ${order.planName}, ${formatMoney(order.price)}. Chọn gói khác sẽ hủy đơn này.`;

export const CONTINUE_PAYMENT = "Tiếp tục thanh toán";

/** For a renter, an admin, or a landlord without `order:create`: no button, and this line. */
export const NOT_A_BUYER_NOTE =
  "Chỉ chủ trọ mới mua được gói, nên tài khoản này không có nút mua.";
