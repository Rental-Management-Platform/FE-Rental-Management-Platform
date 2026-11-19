// The fixed copy of the listing moderation page (scope #21). Every sentence here is Vietnamese. No
// sentence sits under a field: a label, the control and the error are all a field has (design.md,
// "Forms").

import { formatCount } from "@/lib/format";

export const ADMIN_LISTINGS_TITLE = "Kiểm duyệt tin";

export const ADMIN_LISTINGS_DESCRIPTION =
  "Tìm tin của mọi chủ trọ, kể cả tin đang ẩn. Ẩn tin vi phạm kèm lý do và gỡ ẩn khi chủ trọ đã sửa. Gỡ ẩn không tự hiện tin: chủ trọ phải bấm Hiện.";

export const ADMIN_LISTINGS_FORBIDDEN_MESSAGE =
  "Bạn không có quyền kiểm duyệt tin.";

export const ADMIN_LISTINGS_FAILED_TITLE = "Không tải được danh sách tin";

/** The title row of the list zone. A screen reader hears it again when the count changes. */
export const listingsHeading = (total: number) => `${formatCount(total)} tin`;

// The table zone.

export const TABLE_CAPTION = "Danh sách tin để kiểm duyệt";

export const COLUMN_LISTING = "Tin";

export const COLUMN_LANDLORD = "Chủ trọ";

export const COLUMN_PRICE = "Giá thuê";

export const COLUMN_CREATED = "Ngày đăng";

export const COLUMN_STATUS = "Trạng thái";

export const COLUMN_ACTIONS = "Thao tác";

export const NO_NAME = "Chưa đặt tên";

/** The title of a listing that opens the public page, which opens in a new tab. */
export const openListingName = (title: string) =>
  `${title} (mở trang công khai trong tab mới)`;

/** A hidden listing has no public page (it answers 404), so its title is not a link. */
export const NO_PUBLIC_PAGE = "Tin đang ẩn nên chưa có trang công khai.";

// The status of a listing is words and an icon, never color alone.

export const STATUS_VISIBLE = "Đang hiện";

export const STATUS_HIDDEN_BY_OWNER = "Chủ trọ đã ẩn";

export const STATUS_HIDDEN_BY_ADMIN = "Admin đã ẩn";

export const moderationReasonLine = (reason: string) => `Lý do: ${reason}`;

// The filter zone. The search box has a label and a placeholder and nothing under it.

export const FILTERS_LABEL = "Tìm và lọc tin";

export const SEARCH_LABEL = "Tìm kiếm";

export const SEARCH_PLACEHOLDER = "Tiêu đề, nhà trọ hoặc địa chỉ";

export const STATUS_FILTER_LABEL = "Trạng thái";

export const ALL_STATUSES = "Mọi trạng thái";

export const LANDLORD_FILTER_LABEL = "Chủ trọ";

export const ALL_LANDLORDS = "Mọi chủ trọ";

export const CLEAR_FILTERS = "Xóa bộ lọc";

/** The name of a landlord in the table links to the list of only their listings. */
export const onlyLandlordLabel = (name: string) => `Chỉ xem tin của ${name}`;

// The states.

export const NO_LISTINGS_TITLE = "Chưa có tin nào";

export const NO_LISTINGS_DESCRIPTION =
  "Khi chủ trọ đăng tin, tin sẽ hiện ở đây.";

export const NO_MATCH_TITLE = "Không có tin nào khớp";

export const PAGE_EMPTY_TITLE = "Trang này không có tin";

export const VIEW_LAST_PAGE = "Xem trang cuối";

// The buttons of a row. Every name carries the title of its row, so a screen reader that lists the
// buttons of the page can tell them apart.

export const HIDE_BUTTON = "Ẩn";

export const UNHIDE_BUTTON = "Gỡ ẩn";

export const hideButtonName = (title: string) => `Ẩn tin ${title}`;

export const unhideButtonName = (title: string) => `Gỡ ẩn tin ${title}`;

/** What a listing is called in a sentence: its title, cut when it is long. */
export const listingLabel = (listing: { title: string }) => {
  const title = listing.title.trim();
  return title.length > 80 ? `${title.slice(0, 79).trimEnd()}…` : title;
};

// The reason dialog of a hide and of an unhide. The sentence under the title says what the action
// does. The unhide one says the listing does not come back by itself (api 6.29).

export const HIDE_TITLE = "Ẩn tin";

export const HIDE_CONFIRM = "Ẩn tin";

export const HIDE_PLACEHOLDER = "Ví dụ: Ảnh không đúng thực tế";

export const hideDescription = (label: string) =>
  `Tin “${label}” sẽ biến khỏi mọi trang công khai ngay. Chủ trọ thấy lý do bạn nhập và không tự hiện lại tin được.`;

export const UNHIDE_TITLE = "Gỡ ẩn tin";

export const UNHIDE_CONFIRM = "Gỡ ẩn tin";

export const UNHIDE_PLACEHOLDER = "Ví dụ: Chủ trọ đã sửa ảnh";

export const unhideDescription = (label: string) =>
  `Tin “${label}” sẽ chưa hiện với khách: nó về trạng thái chủ trọ đã ẩn, và chủ trọ phải bấm Hiện thì tin mới lên lại.`;

// The toasts after a write.

export const hiddenToast = (label: string) => `Đã ẩn tin “${label}”`;

export const unhiddenToast = (label: string) =>
  `Đã gỡ ẩn tin “${label}”. Chủ trọ cần bấm Hiện để tin hiện lại.`;

// Another admin or the landlord was first, or the listing is gone: the list was read again and
// these say why.

export const STATE_CHANGED_TOAST =
  "Trạng thái của tin này đã đổi do một thay đổi ở nơi khác. Danh sách đã được tải lại.";

export const GONE_TOAST = "Tin này không còn nữa. Danh sách đã được tải lại.";
