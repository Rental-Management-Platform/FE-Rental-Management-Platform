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

// The buttons of a row. Every name says whose review it is and about what, so a screen reader that
// lists the buttons of the page can tell them apart.

export const HIDE_BUTTON = "Ẩn";

export const UNHIDE_BUTTON = "Gỡ ẩn";

/** Which review a button is about: "của Bạn Lan về Anh Minh". */
export const reviewAbout = (author: string, subject: string) =>
  `của ${author} về ${subject}`;

export const hideButtonName = (about: string) => `Ẩn đánh giá ${about}`;

export const unhideButtonName = (about: string) => `Gỡ ẩn đánh giá ${about}`;

// The reason dialog of a hide and of an unhide of a landlord review. The sentence under the title
// says what the action does. The unhide one says the review shows again at once: unlike a listing,
// a review has no step in between (api 6.40).

export const LANDLORD_HIDE_TITLE = "Ẩn đánh giá";

export const LANDLORD_HIDE_CONFIRM = "Ẩn đánh giá";

export const LANDLORD_HIDE_PLACEHOLDER = "Ví dụ: Nội dung xúc phạm cá nhân";

export const landlordHideDescription = (author: string) =>
  `Đánh giá của “${author}” sẽ biến khỏi hồ sơ công khai của chủ trọ và không còn tính vào điểm trung bình ngay. Người viết thấy lý do bạn nhập và chỉ còn xóa được đánh giá, không sửa được.`;

export const LANDLORD_UNHIDE_TITLE = "Gỡ ẩn đánh giá";

export const LANDLORD_UNHIDE_CONFIRM = "Gỡ ẩn đánh giá";

export const LANDLORD_UNHIDE_PLACEHOLDER = "Ví dụ: Đã xem lại, nội dung hợp lệ";

export const landlordUnhideDescription = (author: string) =>
  `Đánh giá của “${author}” sẽ hiện lại ngay trên hồ sơ công khai của chủ trọ và tính lại vào điểm trung bình. Không cần ai bấm thêm.`;

// The toasts after a write.

export const landlordHiddenToast = (author: string) =>
  `Đã ẩn đánh giá của “${author}”`;

export const landlordUnhiddenToast = (author: string) =>
  `Đã gỡ ẩn đánh giá của “${author}”. Đánh giá hiện lại ngay.`;

// Another admin was first, or the writer deleted the review: the list was read again and these say
// why. A delete by the writer wins over a hide (api 6.40), so a 404 means the writer was first.

export const STATE_CHANGED_TOAST =
  "Trạng thái của đánh giá này đã đổi do một thay đổi ở nơi khác. Danh sách đã được tải lại.";

export const LANDLORD_GONE_TOAST =
  "Người viết vừa xóa đánh giá này. Danh sách đã được tải lại.";

/** The name of a landlord in a row opens their public profile, which opens in a new tab. */
export const openLandlordName = (name: string) =>
  `${name} (mở hồ sơ công khai trong tab mới)`;

/** The name of a writer in a row is a filter: the list of only their reviews. */
export const onlyAuthorLabel = (name: string) => `Chỉ xem đánh giá của ${name}`;

// The filter zone. There is no search box: the API has no text search for reviews, only the filters.
// The selects have a label and nothing under them.

export const FILTERS_LABEL = "Lọc đánh giá";

export const STATUS_FILTER_LABEL = "Trạng thái";

export const ALL_STATUSES = "Mọi trạng thái";

export const LANDLORD_FILTER_LABEL = "Chủ trọ";

export const ALL_LANDLORDS = "Mọi chủ trọ";

/** An id in the address that the list of landlords does not hold (loading, or past the first 50). */
export const SELECTED_LANDLORD = "Chủ trọ đã chọn";

export const LANDLORDS_FAILED = "Không tải được danh sách chủ trọ.";

/** The writer is set by pressing a name in the table, so the filter is a chip that takes it off. */
export const AUTHOR_FILTER_LABEL = "Người viết";

/** The writer in the address, when no row of the page says who it is (no review, or still loading). */
export const SELECTED_AUTHOR = "Người viết đã chọn";

export const removeAuthorFilterName = (name: string) =>
  `Bỏ lọc người viết ${name}`;

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
