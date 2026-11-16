// The fixed copy of the pricing page (spec 0021). Every sentence here is Vietnamese. Nothing about
// a plan is written here: names, prices and limits come from `GET /plans`.

import { formatMoney } from "@/lib/format";

export const PRICING_TITLE = "Bảng giá gói đăng tin";

export const PRICING_DESCRIPTION =
  "Chọn gói theo số tin bạn cần hiện cùng lúc. Giá tính cho một kỳ, và thanh toán chỉ là thanh toán thử.";

/** The description of the page for search engines and link cards. No plan data in it. */
export const PRICING_META_DESCRIPTION =
  "Xem các gói đăng tin của Mái Hiên: giá một kỳ, số tin hiện cùng lúc và số ngày mỗi kỳ. Thanh toán chỉ là thanh toán thử.";

/** The title shown when no plan is on sale (AC-12). There is no buy control with it. */
export const NO_PLANS_TITLE = "Chưa có gói nào đang bán";

export const PLANS_FAILED_TITLE = "Không tải được bảng giá";

/** The zone under the cards: three things to know before buying (the sample screen's copy). */
export const GOOD_TO_KNOW_TITLE = "Cần biết trước khi mua";

export const GOOD_TO_KNOW = [
  {
    title: "Dùng thử trước",
    text: "Chủ trọ mới có một kỳ dùng thử với số tin giới hạn. Hết kỳ mà chưa có gói thì tin biến khỏi trang tìm trọ.",
  },
  {
    title: "Gói thay hạn mức dùng thử",
    text: "Gói đang chạy thay hạn mức dùng thử. Tin bị ẩn bớt vì vượt hạn mức hiện lại ngay khi thanh toán xong.",
  },
  {
    title: "Gia hạn không mất ngày nào",
    text: "Mua khi gói còn hạn thì kỳ mới nối vào cuối kỳ hiện tại.",
  },
] as const;

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

// The words of this link live with the order feature, which owns the order page and the history.
export { CONTINUE_PAYMENT } from "@/features/order/order-text";

/** For a renter, an admin, or a landlord without `order:create`: no button, and this line. */
export const NOT_A_BUYER_NOTE =
  "Chỉ chủ trọ mới mua được gói, nên tài khoản này không có nút mua.";
