// The fixed copy of the catalog page (scope #23). Every sentence here is Vietnamese. There is no
// district in it on purpose: since 01/07/2025 an address has two levels, the province or city and
// then the ward, commune or special zone (api-for-frontend.md, 6.15).

import { formatCount } from "@/lib/format";

export const ADMIN_CATALOG_TITLE = "Danh mục";

export const ADMIN_CATALOG_DESCRIPTION =
  "Phường, xã, đặc khu và tiện ích mà chủ trọ chọn khi tạo nhà trọ. Mã và khóa chỉ nhập lúc thêm, sau đó chỉ đổi được tên.";

export const ADMIN_CATALOG_FORBIDDEN_MESSAGE =
  "Bạn không có quyền xem danh mục.";

export const CANCEL = "Hủy";

export const CLOSE = "Đóng";

export const EDIT = "Sửa";

export const DELETE = "Xóa";

export const KEEP = "Giữ lại";

// The wards zone.

export const WARDS_TITLE = "Phường, xã, đặc khu";

export const ADD_WARD = "Thêm phường, xã";

export const WARDS_FAILED_TITLE = "Không tải được danh sách phường, xã";

export const NO_WARDS_TITLE = "Chưa có phường, xã nào";

export const NO_WARDS_DESCRIPTION =
  "Chủ trọ chưa có gì để chọn khi nhập địa chỉ. Thêm phường, xã đầu tiên.";

export const SEARCH_LABEL = "Tìm theo tên hoặc mã";

export const SEARCH_PLACEHOLDER = "Bến Thành hoặc 26743";

export const CLEAR_SEARCH = "Xóa ô tìm";

export const noMatchTitle = (text: string) =>
  `Không có phường, xã nào khớp “${text.trim()}”`;

/** The heading of the table, which a screen reader hears again when the count changes. */
export const wardsHeading = (shown: number, total: number) =>
  shown === total
    ? `${formatCount(total)} phường, xã, đặc khu`
    : `${formatCount(shown)} trong ${formatCount(total)} phường, xã, đặc khu`;

export const WARDS_CAPTION = "Danh sách phường, xã, đặc khu";

export const COLUMN_CODE = "Mã";

export const COLUMN_NAME = "Tên";

export const COLUMN_PROVINCE = "Tỉnh, thành phố";

export const COLUMN_BOX = "Hộp bản đồ";

export const COLUMN_KEY = "Khóa";

export const COLUMN_ACTIONS = "Thao tác";

/** The box of a ward limits the pin on the map. Only the migration and the seed write it. */
export const HAS_BOX = "Có";

export const NO_BOX = "Chưa có";

export const editLabel = (name: string) => `Sửa ${name}`;

export const deleteLabel = (name: string) => `Xóa ${name}`;

// The ward dialog.

export const WARD_CREATE_TITLE = "Thêm phường, xã";

export const WARD_CREATE_DESCRIPTION =
  "Mã và mã tỉnh chỉ nhập lúc này, sau đó không đổi được. Phường thêm ở đây chưa có hộp bản đồ.";

export const wardEditTitle = (name: string) => `Sửa “${name}”`;

export const wardEditDescription = (code: string) =>
  `Mã ${code} và mã tỉnh không đổi được. Đổi tên sẽ cập nhật địa chỉ ở mọi nhà trọ và tin của phường này.`;

export const WARD_CODE_LABEL = "Mã phường, xã";

export const WARD_CODE_PLACEHOLDER = "26743";

export const WARD_NAME_LABEL = "Tên đầy đủ";

export const WARD_NAME_PLACEHOLDER = "Phường Bến Thành";

export const PROVINCE_CODE_LABEL = "Mã tỉnh, thành phố";

export const PROVINCE_CODE_PLACEHOLDER = "79";

export const PROVINCE_NAME_LABEL = "Tên tỉnh, thành phố";

export const PROVINCE_NAME_PLACEHOLDER = "Thành phố Hồ Chí Minh";

export const wardCreatedToast = (name: string) => `Đã thêm “${name}”`;

export const wardSavedToast = (name: string) => `Đã lưu “${name}”`;

export const wardDeletedToast = (name: string) => `Đã xóa “${name}”`;

export const wardDeleteTitle = (name: string) => `Xóa “${name}”?`;

export const WARD_DELETE_DESCRIPTION =
  "Phường, xã này sẽ biến khỏi danh sách chủ trọ chọn. Bạn không thể hoàn tác thao tác này.";

// The amenities zone.

export const AMENITIES_TITLE = "Tiện ích";

export const ADD_AMENITY = "Thêm tiện ích";

export const AMENITIES_FAILED_TITLE = "Không tải được danh sách tiện ích";

export const NO_AMENITIES_TITLE = "Chưa có tiện ích nào";

export const NO_AMENITIES_DESCRIPTION =
  "Chủ trọ chưa có tiện ích nào để chọn. Thêm tiện ích đầu tiên.";

export const amenitiesHeading = (total: number) =>
  `${formatCount(total)} tiện ích`;

export const AMENITIES_CAPTION = "Danh sách tiện ích";

export const AMENITY_CREATE_TITLE = "Thêm tiện ích";

export const AMENITY_CREATE_DESCRIPTION =
  "Khóa chỉ nhập lúc này, sau đó không đổi được. Chủ trọ chọn tiện ích theo tên.";

export const amenityEditTitle = (name: string) => `Sửa “${name}”`;

export const amenityEditDescription = (key: string) =>
  `Khóa ${key} không đổi được. Chỉ đổi được tên.`;

export const AMENITY_KEY_LABEL = "Khóa tiện ích";

export const AMENITY_KEY_PLACEHOLDER = "may_lanh";

export const AMENITY_NAME_LABEL = "Tên tiện ích";

export const AMENITY_NAME_PLACEHOLDER = "Máy lạnh";

export const amenityCreatedToast = (name: string) => `Đã thêm “${name}”`;

export const amenitySavedToast = (name: string) => `Đã lưu “${name}”`;

export const amenityDeletedToast = (name: string) => `Đã xóa “${name}”`;

export const amenityDeleteTitle = (name: string) => `Xóa “${name}”?`;

export const AMENITY_DELETE_DESCRIPTION =
  "Tiện ích này sẽ biến khỏi danh sách chủ trọ chọn. Bạn không thể hoàn tác thao tác này.";

// Both forms and both delete dialogs.

export const CREATE_SUBMIT = "Thêm";

export const CREATING = "Đang thêm";

export const SAVE_SUBMIT = "Lưu thay đổi";

export const SAVING = "Đang lưu";

export const DELETE_CONFIRM = "Xóa";

export const DELETING = "Đang xóa";

/** `CATALOG_IN_USE`: an entry that any property names, a deleted one too, can never be deleted. */
export const IN_USE_TITLE =
  "Mục này đang được nhà trọ sử dụng nên chưa thể xóa";

export const IN_USE_HINT =
  "Nhà trọ đã xóa vẫn giữ mục này, nên một mục từng được dùng thì không xóa được. Hãy đổi tên thay vì xóa.";

/** 404 on a delete or a rename: another admin deleted it first. */
export const GONE_TOAST = "Mục này không còn nữa";
