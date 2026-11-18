// The fixed copy of the admin users page (scope #20, spec 0023). Every sentence here is
// Vietnamese. No sentence sits under a field: a label, the control and the error are all a field
// has (design.md, "Forms").

import { formatCount } from "@/lib/format";

export const ADMIN_USERS_TITLE = "Người dùng";

export const ADMIN_USERS_DESCRIPTION =
  "Tìm tài khoản để khóa, mở khóa hoặc thu hồi phiên đăng nhập. Danh sách có mọi loại tài khoản, người mới đăng ký nằm trên cùng.";

export const ADMIN_USERS_FORBIDDEN_MESSAGE =
  "Bạn không có quyền xem danh sách người dùng.";

export const ADMIN_USERS_FAILED_TITLE = "Không tải được danh sách người dùng";

/** The title row of the list zone. A screen reader hears it again when the count changes. */
export const usersHeading = (total: number) =>
  `${formatCount(total)} người dùng`;

// The table zone.

export const TABLE_CAPTION = "Danh sách người dùng";

export const COLUMN_USER = "Người dùng";

export const COLUMN_PHONE = "Số điện thoại";

export const COLUMN_TYPE = "Loại tài khoản";

export const COLUMN_CREATED = "Ngày đăng ký";

export const COLUMN_STATUS = "Trạng thái";

export const NO_NAME = "Chưa đặt tên";

export const NO_PHONE = "Chưa có";

// The status of an account is words and an icon, never color alone.

export const STATUS_ACTIVE = "Đang hoạt động";

export const STATUS_LOCKED = "Đã khóa";

export const lockedReasonLine = (reason: string) => `Lý do: ${reason}`;

// The filter zone. The search box has a label and a placeholder and nothing under it.

export const FILTERS_LABEL = "Tìm và lọc người dùng";

export const SEARCH_LABEL = "Tìm kiếm";

export const SEARCH_PLACEHOLDER = "Email, tên đúng dấu hoặc số điện thoại";

export const TYPE_FILTER_LABEL = "Loại tài khoản";

export const ALL_TYPES = "Mọi loại tài khoản";

export const STATUS_FILTER_LABEL = "Trạng thái";

export const ALL_STATUSES = "Mọi trạng thái";

export const CLEAR_FILTERS = "Xóa bộ lọc";

// The states.

export const NO_USERS_TITLE = "Chưa có người dùng nào";

export const NO_USERS_DESCRIPTION =
  "Khi có người đăng ký tài khoản, họ sẽ hiện ở đây.";

export const NO_MATCH_TITLE = "Không có người dùng nào khớp";

/** The one thing a search cannot do, said where it shows (the API is accent sensitive, 6.34). */
export const NO_MATCH_ACCENT =
  "Tên phải gõ đúng dấu: “nguyen” không tìm ra “Nguyễn”.";

export const PAGE_EMPTY_TITLE = "Trang này không có người dùng";

export const VIEW_LAST_PAGE = "Xem trang cuối";
