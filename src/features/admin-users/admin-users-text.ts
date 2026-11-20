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

// The dialog of "Xem chi tiết". A row shows only the short status; the reason an admin typed when
// locking the account is read here, so no row grows taller than the others.

export const DETAIL_TITLE = "Chi tiết người dùng";

export const LOCK_REASON_LABEL = "Lý do khóa";

export const NO_LOCK_REASON = "Không có lý do";

export const MY_ACCOUNT_NOTE =
  "Đây là tài khoản của bạn. Bạn không tự khóa hay thu hồi phiên của mình ở đây.";

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

// The actions column. Every button name carries the email of its row, so a screen reader that
// lists the buttons of the page can tell them apart.

export const COLUMN_ACTIONS = "Thao tác";

export const MY_ACCOUNT = "Tài khoản của bạn";

export const LOCK_BUTTON = "Khóa";

export const UNLOCK_BUTTON = "Mở khóa";

export const lockButtonName = (email: string) => `Khóa tài khoản ${email}`;

export const unlockButtonName = (email: string) => `Mở khóa tài khoản ${email}`;

/** What an account is called in a toast: the name, or the email when there is no name. */
export const userLabel = (user: { name: string | null; email: string }) =>
  user.name?.trim() ? user.name.trim() : user.email;

// The reason dialog of a lock and of an unlock. The sentence under the title says what the action
// does, and for an account of an admin it adds who the account is, because a wrong click there
// costs more.

const ADMIN_ACCOUNT_NOTE = "Đây là tài khoản quản trị.";

export const LOCK_TITLE = "Khóa tài khoản";

export const LOCK_CONFIRM = "Khóa tài khoản";

export const LOCK_PLACEHOLDER = "Ví dụ: Đăng tin giả mạo";

export const lockDescription = (email: string, isAdmin: boolean) =>
  `${email} sẽ mất mọi phiên đăng nhập ngay và không đăng nhập lại được cho đến khi mở khóa.${isAdmin ? ` ${ADMIN_ACCOUNT_NOTE}` : ""}`;

export const UNLOCK_TITLE = "Mở khóa tài khoản";

export const UNLOCK_CONFIRM = "Mở khóa tài khoản";

export const UNLOCK_PLACEHOLDER = "Ví dụ: Đã xác minh lại";

export const unlockDescription = (email: string, isAdmin: boolean) =>
  `${email} sẽ đăng nhập lại được, nhưng các phiên cũ không được khôi phục.${isAdmin ? ` ${ADMIN_ACCOUNT_NOTE}` : ""}`;

// The toasts after a write.

export const lockedToast = (label: string) => `Đã khóa tài khoản ${label}`;

export const unlockedToast = (label: string) => `Đã mở khóa tài khoản ${label}`;

// Another admin was first, or the account is gone: the list was read again and these say why.

export const ALREADY_LOCKED_TOAST =
  "Tài khoản này đã bị khóa do một thay đổi ở nơi khác. Danh sách đã được tải lại.";

export const ALREADY_ACTIVE_TOAST =
  "Tài khoản này đang hoạt động do một thay đổi ở nơi khác. Danh sách đã được tải lại.";

export const GONE_TOAST =
  "Tài khoản này không còn tồn tại. Danh sách đã được tải lại.";

// The revoke dialog. It is an alert dialog, so the first focus lands on the safe button.

export const REVOKE_BUTTON = "Thu hồi phiên";

export const revokeButtonName = (email: string) => `Thu hồi phiên của ${email}`;

export const revokeTitle = (label: string) => `Thu hồi mọi phiên của ${label}?`;

export const REVOKE_DESCRIPTION =
  "Người này sẽ phải đăng nhập lại ở mọi thiết bị. Tài khoản không bị khóa và không đổi gì khác.";

export const REVOKE_CONFIRM = "Thu hồi phiên";

export const REVOKING = "Đang thu hồi";

export const REVOKE_KEEP = "Hủy";

export const revokedToast = (label: string) =>
  `Đã thu hồi mọi phiên của ${label}`;
