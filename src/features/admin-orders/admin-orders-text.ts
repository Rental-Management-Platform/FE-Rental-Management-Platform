// The fixed copy of the admin orders page (scope #25). Every sentence here is Vietnamese. Every
// money figure on the page is a test payment, so the page says so in its header and next to the
// totals (api-for-frontend.md, 6.37: never call these numbers "doanh thu thật").

export const ADMIN_ORDERS_TITLE = "Đơn của mọi chủ trọ";

export const ADMIN_ORDERS_DESCRIPTION =
  "Mọi đơn mua gói của các chủ trọ. Thanh toán chỉ là thanh toán thử, không có tiền thật.";

export const ADMIN_ORDERS_FORBIDDEN_MESSAGE =
  "Bạn không có quyền xem đơn của mọi chủ trọ.";

export const ADMIN_ORDERS_FAILED_TITLE = "Không tải được danh sách đơn";

// The filter zone.

export const FILTERS_LABEL = "Lọc đơn";

export const PLAN_LABEL = "Gói";

export const LANDLORD_LABEL = "Chủ trọ";

export const FROM_LABEL = "Từ ngày";

export const TO_LABEL = "Đến ngày";

export const DAY_PLACEHOLDER = "Chọn ngày";

export const ALL_PLANS = "Tất cả gói";

export const ALL_LANDLORDS = "Tất cả chủ trọ";

/** An id in the address that the loaded lists do not hold (a list longer than one page of 50). */
export const SELECTED_PLAN = "Gói đã chọn";

export const PLAN_OFF = "đã tắt";

export const PLANS_FAILED = "Không tải được danh sách gói.";

export const BACKWARDS_FIELD_ERROR =
  "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";

export const CLEAR_FILTERS = "Xóa bộ lọc";

// The totals zone.

export const TOTALS_TITLE = "Tổng theo bộ lọc";

export const PAID_COUNT_LABEL = "Số đơn đã trả";

export const PAID_AMOUNT_LABEL = "Tổng tiền đã trả";

export const TEST_PAYMENT_BADGE = "Thanh toán thử";

export const TOTALS_NOTE =
  "Cộng trên mọi đơn khớp bộ lọc, không chỉ trang đang xem. Đây là tiền của thanh toán thử.";

export const TOTALS_LOADING = "Đang tải tổng";

// The table zone.

export const TABLE_CAPTION = "Danh sách đơn mua gói của mọi chủ trọ";

export const COLUMN_CODE = "Mã đơn";

export const COLUMN_LANDLORD = "Chủ trọ";

export const COLUMN_PLAN = "Gói";

export const COLUMN_STATUS = "Trạng thái";

export const COLUMN_CREATED = "Ngày tạo đơn";

export const COLUMN_ACTIONS = "Thao tác";

export const STATUS_NAV_LABEL = "Lọc đơn theo trạng thái";

/** The name of the link on a landlord, which sets the landlord filter. */
export const onlyLandlordLabel = (label: string) => `Chỉ xem đơn của ${label}`;

export const NO_ORDERS_TITLE = "Chưa có đơn nào";

export const NO_ORDERS_DESCRIPTION =
  "Khi một chủ trọ mua gói, đơn của họ sẽ hiện ở đây.";

export const NO_MATCH_TITLE = "Không có đơn nào khớp bộ lọc";

export const BACKWARDS_TITLE = "Khoảng ngày chưa đúng";

export const BACKWARDS_DESCRIPTION =
  "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.";
