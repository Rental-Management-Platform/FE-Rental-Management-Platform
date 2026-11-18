// The fixed copy of the review moderation page (scope #36). Every sentence here is Vietnamese. No
// sentence sits under a field: a label, the control and the error are all a field has (design.md,
// "Forms").

import { formatCount } from "@/lib/format";

export const ADMIN_REVIEWS_TITLE = "Kiểm duyệt đánh giá";

/**
 * The line under the title. It says what an unhide does, because an unhide of a review differs from
 * an unhide of a listing: the review goes straight back to showing (api 6.40), with no step for the
 * landlord or the writer in between.
 */
export const ADMIN_REVIEWS_DESCRIPTION =
  "Tìm đánh giá về chủ trọ, kể cả đánh giá đang ẩn. Ẩn đánh giá vi phạm kèm lý do. Gỡ ẩn đưa đánh giá hiện lại ngay, không cần ai bấm thêm.";

export const ADMIN_REVIEWS_FORBIDDEN_MESSAGE =
  "Bạn không có quyền kiểm duyệt đánh giá.";

// The columns, shared by the table and the blocks.

export const COLUMN_STARS = "Số sao";

export const COLUMN_COMMENT = "Nhận xét";

export const COLUMN_AUTHOR = "Người viết";

export const COLUMN_LANDLORD = "Chủ trọ";

export const COLUMN_WRITTEN = "Ngày viết";

export const COLUMN_STATUS = "Trạng thái";

export const COLUMN_ACTIONS = "Thao tác";

/** A review may have stars and nothing else (api 6.40: the comment is optional). */
export const NO_COMMENT = "Không có nhận xét";

/** A name the account never set (`null` in the row, no email to fall back on). */
export const NO_NAME = "Chưa đặt tên";

// The status of a review is words and an icon, never color alone. A review has two states only:
// it shows, or an admin hid it.

export const STATUS_VISIBLE = "Đang hiện";

export const STATUS_HIDDEN_BY_ADMIN = "Admin đã ẩn";

export const hiddenReasonLine = (reason: string) => `Lý do: ${reason}`;

// The landlord reviews zone.

export const LANDLORD_ZONE_TABLE_CAPTION =
  "Danh sách đánh giá chủ trọ để kiểm duyệt";

export const LANDLORD_ZONE_FAILED_TITLE =
  "Không tải được danh sách đánh giá chủ trọ";

/** The title row of the list zone. A screen reader hears it again when the count changes. */
export const reviewsHeading = (total: number) =>
  `${formatCount(total)} đánh giá`;

// The states of a list. They are the same words for both kinds of review.

export const NO_REVIEWS_TITLE = "Chưa có đánh giá nào";

export const LANDLORD_NO_REVIEWS_DESCRIPTION =
  "Khi người tìm trọ đánh giá một chủ trọ, đánh giá sẽ hiện ở đây.";

export const NO_MATCH_TITLE = "Không có đánh giá nào khớp";

export const PAGE_EMPTY_TITLE = "Trang này không có đánh giá";

export const VIEW_LAST_PAGE = "Xem trang cuối";

export const CLEAR_FILTERS = "Xóa bộ lọc";

export const PAGINATION_ITEM_LABEL = "đánh giá";
