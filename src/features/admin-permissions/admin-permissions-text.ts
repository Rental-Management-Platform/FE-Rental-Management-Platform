// The fixed copy of the permissions page (scope #24). Every sentence here is Vietnamese. The API
// gives only keys (`listing`, `moderate`), so the words for them are written here, and a key that
// has no words yet (a module added to the backend later) shows as the key itself, never as nothing.

import type { AccountType } from "@/lib/api/types";
import { formatCount } from "@/lib/format";

export const ADMIN_PERMISSIONS_TITLE = "Phân quyền";

export const ADMIN_PERMISSIONS_DESCRIPTION =
  "Chọn hành động mà người đăng bài và người tìm trọ được làm. Quyền của quản trị viên không đổi được.";

export const ADMIN_PERMISSIONS_FORBIDDEN_MESSAGE =
  "Bạn không có quyền xem phân quyền.";

export const READ_FAILED_TITLE = "Không tải được phân quyền";

export const NOTE_TITLE = "Khi bạn lưu";

/** The delay is in the contract (api-for-frontend.md, section 5): a token carries a copy of the permissions. */
export const NOTE =
  "Quyền mới có hiệu lực với người đang đăng nhập trong tối đa 15 phút, khi phiên của họ làm mới. Người đăng nhập lại thì có ngay.";

export const READ_ONLY_NOTE =
  "Bạn chỉ có quyền xem phân quyền, không lưu được.";

export const ZONE_TITLE = "Quyền theo loại tài khoản";

export const TABLE_CAPTION =
  "Ma trận hành động theo module cho từng loại tài khoản";

export const COLUMN_ACTION = "Hành động";

/** The names of the three types if the API sent none. */
export const TYPE_NAME: Record<AccountType, string> = {
  landlord: "Người đăng bài",
  tenant: "Người tìm trọ",
  admin: "Quản trị viên",
};

export const FIXED_TYPE_NOTE = "Không đổi được";

export const countLabel = (count: number) => `${formatCount(count)} quyền`;

export const ADMIN_ONLY = "Chỉ dành cho quản trị viên";

export const YES = "có";

export const NO = "không";

const OWNER_WORD = { read: "xem", update: "sửa", delete: "xóa" } as const;

/**
 * The line under an owner scoped module: only the actions it has among read, update and delete reach
 * the caller's own data and no one else's (api-for-frontend.md, section 5). A module that has none
 * of the three (messages only have "create") gets no line, so the line never talks about an action
 * that is not in the list.
 */
export const ownerScopedNote = (actions: readonly string[]): string | null => {
  const words = (Object.keys(OWNER_WORD) as (keyof typeof OWNER_WORD)[])
    .filter((action) => actions.includes(action))
    .map((action) => OWNER_WORD[action]);
  if (words.length === 0) return null;
  const list =
    words.length === 1
      ? words[0]
      : `${words.slice(0, -1).join(", ")} và ${words[words.length - 1]}`;
  return `Quyền ${list} chỉ áp cho dữ liệu của chính người dùng.`;
};

/** The line under the name of a module, or `null` when it has none to say. */
export const moduleNote = (module: {
  ownerScoped: boolean;
  actions: readonly { action: string }[];
}): string | null =>
  module.ownerScoped
    ? ownerScopedNote(module.actions.map((entry) => entry.action))
    : null;

/** The name of one box: the type, then the module and the action, so every box has its own. */
export const cellLabel = (typeName: string, module: string, action: string) =>
  `${typeName}: ${moduleLabel(module)}, ${actionLabel(module, action)}`;

// The bar of changes that are not saved yet.

export const UNSAVED_TITLE = "Có thay đổi chưa lưu";

export const changeSummary = (
  typeName: string,
  { added, removed }: { added: number; removed: number },
) => {
  const parts = [
    added > 0 ? `thêm ${formatCount(added)}` : null,
    removed > 0 ? `bớt ${formatCount(removed)}` : null,
  ].filter((part) => part !== null);
  return `${typeName}: ${parts.join(", ")}`;
};

export const SAVE = "Lưu thay đổi";

export const SAVING = "Đang lưu";

export const DISCARD = "Hủy thay đổi";

export const savedToast = (typeName: string) =>
  `Đã lưu quyền của ${typeName}. Quyền mới có hiệu lực trong tối đa 15 phút.`;

export const saveFailedTitle = (typeName: string) =>
  `Chưa lưu được quyền của ${typeName}`;

export const IGNORED_TITLE = "Máy chủ có quyền không hiện trong bảng";

export const ignoredText = (typeName: string, keys: readonly string[]) =>
  `${typeName} đang giữ ${keys.join(", ")}, các khóa không có trong danh mục hoặc chỉ dành cho quản trị viên. Khi bạn lưu, chúng sẽ bị bỏ.`;

// Words for the keys of the catalog.

const MODULE_LABEL: Record<string, string> = {
  profile: "Hồ sơ cá nhân",
  user: "Người dùng",
  account_type: "Loại tài khoản và quyền",
  catalog: "Danh mục phường, xã và tiện ích",
  setting: "Tham số hệ thống",
  property: "Nhà trọ",
  listing: "Tin đăng",
  favorite: "Tin đã lưu",
  follow: "Theo dõi chủ trọ",
  plan: "Gói",
  order: "Đơn mua gói",
  subscription: "Kỳ dùng thử và gói đang dùng",
  conversation: "Cuộc trò chuyện",
  message: "Tin nhắn",
  review: "Đánh giá",
  statistic: "Thống kê",
};

const ACTION_LABEL: Record<string, string> = {
  read: "Xem",
  create: "Tạo",
  update: "Sửa",
  delete: "Xóa",
  moderate: "Kiểm duyệt",
  lock: "Khóa và mở khóa",
  revoke: "Thu hồi phiên",
  cancel: "Hủy",
  report: "Xem báo cáo",
};

// Where one verb means something more exact in its module (api-for-frontend.md, sections 5 and 6).
const ACTION_OVERRIDE: Record<string, string> = {
  "user:read": "Xem danh sách người dùng",
  "user:lock": "Khóa và mở khóa tài khoản",
  "user:revoke": "Thu hồi phiên đăng nhập",
  "listing:moderate": "Ẩn và gỡ ẩn tin của người khác",
  "favorite:create": "Lưu tin",
  "favorite:delete": "Bỏ lưu tin",
  "follow:create": "Theo dõi",
  "follow:delete": "Bỏ theo dõi",
  "order:create": "Tạo đơn và thanh toán thử",
  "order:read": "Xem đơn của mình",
  "order:cancel": "Hủy đơn",
  "order:report": "Xem đơn và doanh thu của mọi chủ trọ",
  "subscription:read": "Xem kỳ dùng thử và hạn mức",
  "conversation:create": "Mở cuộc trò chuyện",
  "conversation:update": "Đánh dấu đã đọc",
  "message:create": "Gửi tin nhắn",
  "review:moderate": "Ẩn và gỡ ẩn đánh giá",
  "statistic:read": "Xem thống kê của chủ trọ",
  "statistic:report": "Xem thống kê tổng quan của nền tảng",
};

export const moduleLabel = (module: string): string =>
  MODULE_LABEL[module] ?? module;

export const actionLabel = (module: string, action: string): string =>
  ACTION_OVERRIDE[`${module}:${action}`] ?? ACTION_LABEL[action] ?? action;
