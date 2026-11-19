// The words of the landlord picker, which the orders, listing moderation and review moderation
// filters all use. The label and the "all" row come from the page, since each page names them its
// own way.

/** Cut the typed text to this many characters when it is repeated back in a message. */
const ECHO_LENGTH = 40;

export const LANDLORD_PICKER_TEXT = {
  boxLabel: "Chọn chủ trọ",
  searchLabel: "Tìm chủ trọ",
  searchPlaceholder: "Email, tên đúng dấu hoặc số điện thoại",
  listLabel: "Danh sách chủ trọ",
  // Shown on the button when the address names a landlord this list does not hold.
  selected: "Chủ trọ đã chọn",
  failed: "Không tải được danh sách chủ trọ.",
  none: "Chưa có chủ trọ nào.",
  noMatch: (typed: string) =>
    `Không có chủ trọ nào khớp “${typed.slice(0, ECHO_LENGTH)}”. Tên phải gõ đúng dấu, hoặc tìm bằng email.`,
  moreThanShown: (shown: string, total: string) =>
    `Đang hiện ${shown} trên ${total} chủ trọ. Gõ để tìm người khác.`,
  moreThanShownMatching: (shown: string, total: string) =>
    `Đang hiện ${shown} trên ${total} chủ trọ khớp. Gõ thêm để thu hẹp.`,
} as const;
