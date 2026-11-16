// The fixed copy of the plans and trial settings page (scope #22). Every sentence here is
// Vietnamese. A plan is a product the landlords buy with a test payment, so the page never talks
// about real money.

import type { AdminPlan, SettingKey } from "@/lib/api/types";
import { formatCount } from "@/lib/format";

export const ADMIN_PLANS_TITLE = "Gói và dùng thử";

export const ADMIN_PLANS_DESCRIPTION =
  "Tạo và sửa các gói chủ trọ có thể mua, và đặt số ngày, số tin của kỳ dùng thử. Thanh toán chỉ là thanh toán thử.";

export const ADMIN_PLANS_FORBIDDEN_MESSAGE = "Bạn không có quyền xem các gói.";

// The plans zone.

export const PLANS_TITLE = "Các gói";

export const ADD_PLAN = "Thêm gói";

export const PLANS_FAILED_TITLE = "Không tải được danh sách gói";

export const NO_PLANS_TITLE = "Chưa có gói nào";

export const NO_PLANS_DESCRIPTION =
  "Chủ trọ chưa có gói nào để mua. Thêm gói đầu tiên để bảng giá có nội dung.";

/** The heading of the table, which a screen reader hears again when the count changes. */
export const plansHeading = (plans: readonly Pick<AdminPlan, "isActive">[]) => {
  const off = plans.filter((plan) => !plan.isActive).length;
  const base = `${formatCount(plans.length)} gói`;
  return off === 0 ? base : `${base}, ${formatCount(off)} đã tắt`;
};

export const TABLE_CAPTION = "Danh sách các gói, kể cả gói đã tắt";

export const COLUMN_NAME = "Tên gói";

export const COLUMN_PRICE = "Giá một kỳ";

export const COLUMN_LIMIT = "Tin hiện cùng lúc";

export const COLUMN_DAYS = "Số ngày một kỳ";

export const COLUMN_ACTIVE = "Đang bán";

export const COLUMN_UPDATED = "Sửa lần cuối";

export const COLUMN_ACTIONS = "Thao tác";

export const ON_SALE = "Đang bán";

export const OFF_SALE = "Đã tắt";

export const FREE = "Miễn phí";

export const daysLine = (days: number) => `${formatCount(days)} ngày`;

export const editLabel = (name: string) => `Sửa gói ${name}`;

export const deleteLabel = (name: string) => `Xóa gói ${name}`;

/** The name of the switch of a row: its state is read from the switch itself. */
export const saleSwitchLabel = (name: string) => `Đang bán gói ${name}`;

export const EDIT = "Sửa";

export const DELETE = "Xóa";

// The create and edit dialog.

export const CREATE_TITLE = "Thêm gói";

export const CREATE_DESCRIPTION =
  "Gói mới bán ngay trong bảng giá. Bạn tắt được gói sau đó.";

export const editTitle = (name: string) => `Sửa gói “${name}”`;

export const EDIT_DESCRIPTION =
  "Giá, số tin và số ngày mới chỉ áp cho đơn tạo sau đó. Đơn đã tạo giữ nguyên.";

export const NAME_LABEL = "Tên gói";

export const NAME_PLACEHOLDER = "Nâng cao";

export const PRICE_LABEL = "Giá một kỳ (đồng)";

export const PRICE_PLACEHOLDER = "199000";

export const LIMIT_LABEL = "Số tin hiện cùng lúc";

export const LIMIT_PLACEHOLDER = "15";

export const DAYS_LABEL = "Số ngày mỗi kỳ";

export const DAYS_PLACEHOLDER = "30";

export const CREATE_SUBMIT = "Tạo gói";

export const CREATING = "Đang tạo";

export const SAVE_SUBMIT = "Lưu thay đổi";

export const SAVING = "Đang lưu";

export const CANCEL = "Hủy";

export const createdToast = (name: string) => `Đã tạo gói “${name}”`;

export const savedToast = (name: string) => `Đã lưu gói “${name}”`;

// The sale switch.

export const turnedOnToast = (name: string) => `Đã bật bán gói “${name}”`;

export const turnedOffToast = (name: string) => `Đã tắt gói “${name}”`;

/** Names the plan in the notice above the table when a switch fails. */
export const toggleFailedTitle = (name: string) =>
  `Chưa đổi được trạng thái gói “${name}”`;

// The delete dialog.

export const deleteTitle = (name: string) => `Xóa gói “${name}”?`;

export const DELETE_DESCRIPTION =
  "Gói sẽ biến khỏi bảng giá và khỏi danh sách này. Bạn không thể hoàn tác thao tác này.";

export const KEEP_PLAN = "Giữ lại";

export const DELETE_CONFIRM = "Xóa gói";

export const DELETING = "Đang xóa";

/** `PLAN_IN_USE`: a plan with any order, a cancelled one too, can never be deleted. */
export const IN_USE_TITLE = "Gói này đã có đơn nên không xóa được";

export const IN_USE_ON_SALE = "Hãy tắt gói để ngừng bán.";

export const IN_USE_ALREADY_OFF =
  "Gói này đã tắt, nên chủ trọ không mua được nữa.";

export const TURN_OFF = "Tắt gói";

export const TURNING_OFF = "Đang tắt";

export const CLOSE = "Đóng";

export const deletedToast = (name: string) => `Đã xóa gói “${name}”`;

export const GONE_TOAST = "Gói này không còn nữa";

// The trial settings zone.

export const TRIAL_TITLE = "Kỳ dùng thử";

export const TRIAL_NOTE_TITLE = "Khi đổi các tham số này";

export const TRIAL_NOTE =
  "Số ngày dùng thử chỉ áp cho chủ trọ đăng ký sau đó, người đã đăng ký giữ hạn cũ. Số tin dùng thử có hiệu lực ngay cho mọi chủ trọ còn trong kỳ.";

export const SETTING_LABEL: Record<SettingKey, string> = {
  trial_days: "Số ngày dùng thử",
  trial_listing_limit: "Số tin hiện cùng lúc trong kỳ dùng thử",
};

export const SETTING_SAVE = "Lưu";

export const SETTING_SAVING = "Đang lưu";

export const settingSavedToast = (key: SettingKey) =>
  `Đã lưu: ${SETTING_LABEL[key].toLowerCase()}`;

export const SETTINGS_FAILED_TITLE = "Không tải được tham số dùng thử";

export const READ_ONLY_NOTE = "Bạn chỉ có quyền xem các tham số này.";

export const NEVER_EDITED = "Chưa sửa lần nào, đang dùng giá trị mặc định.";

export const SOMEONE = "một quản trị viên";

export const YOU = "bạn";

export const editedLine = (who: string, day: string) =>
  `Sửa lần cuối bởi ${who}, ngày ${day}.`;
