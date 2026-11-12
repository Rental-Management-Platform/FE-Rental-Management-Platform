import type { PinCheck } from "./area";

// Every sentence of the location map that a rule or a state produces (spec 0011). Fixed labels
// and headings stay in the components that draw them.

export const CITY_NAME = "khu vực Thành phố Hồ Chí Minh";

/** The refusal under the map after a click or a drag outside the allowed area (AC-4). */
export const refusalText = (wardName: string | null) =>
  `Chỉ ghim được trong ${wardName ?? CITY_NAME}.`;

// The number fields (AC-6). The two area messages are put on both fields together.
export const BOTH_OR_NONE_MESSAGE =
  "Nhập cả vĩ độ và kinh độ, hoặc để trống cả hai.";
export const LATITUDE_NUMBER_MESSAGE = "Vĩ độ phải là một số.";
export const LONGITUDE_NUMBER_MESSAGE = "Kinh độ phải là một số.";
export const LATITUDE_RANGE_MESSAGE = "Vĩ độ từ -90 đến 90.";
export const LONGITUDE_RANGE_MESSAGE = "Kinh độ từ -180 đến 180.";
export const OUTSIDE_CITY_MESSAGE =
  "Điểm này nằm ngoài khu vực Thành phố Hồ Chí Minh.";
export const outsideWardMessage = (wardName: string) =>
  `Điểm này nằm ngoài ${wardName}. Hãy ghim trong phường đã chọn.`;

/** The message the two number fields get for a point the area check refused. */
export function areaMessage(check: Exclude<PinCheck, "ok">, wardName: string) {
  return check === "outside-city"
    ? OUTSIDE_CITY_MESSAGE
    : outsideWardMessage(wardName);
}

// The lookups (AC-8, AC-9, AC-14). One line under the map shows the latest of these.
export const SEARCHING_TEXT = "Đang tìm vị trí trên bản đồ.";
export const REVERSING_TEXT = "Đang lấy địa chỉ gần điểm này.";
export const notFoundText = (wardName: string) =>
  `Không tìm thấy địa chỉ này trong ${wardName}. Hãy bấm lên bản đồ để ghim.`;
export const SEARCH_FAILED_TEXT =
  "Chưa tìm được địa chỉ lúc này. Bạn vẫn có thể bấm lên bản đồ.";
export const REVERSE_FAILED_TEXT = "Chưa lấy được địa chỉ gần điểm này.";
export const NO_ROAD_TEXT = "Chưa có tên đường gần điểm này.";
export const filledAddressText = (text: string) =>
  `Địa chỉ đã đổi theo điểm ghim: ${text}. Theo dữ liệu OpenStreetMap, có thể chưa đúng, hãy kiểm tra lại.`;

// Announcements and notes (AC-8, AC-10, AC-17).
export const PIN_CLEARED_ANNOUNCEMENT = "Đã xóa ghim.";
export const PIN_FROM_ADDRESS_ANNOUNCEMENT = "Đã ghim theo địa chỉ";
export const droppedPinNote = (wardName: string) =>
  `Đã bỏ ghim vì nằm ngoài ${wardName}. Hãy ghim lại.`;
export const savedPinOutOfPlaceNote = (wardName: string) =>
  `Vị trí đã lưu nằm ngoài ${wardName}. Hãy ghim lại.`;
