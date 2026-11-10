// The Vietnamese words of the ward picker (spec 0015), in one place so the picker and its
// `/dev/ui` samples say the same thing.

/** Cut the typed text to this many characters when it is repeated back in a message. */
const ECHO_LENGTH = 40;

export const WARD_TEXTS = {
  placeholder: "Chọn phường hoặc xã",
  loading: "Đang tải danh sách",
  boxLabel: "Chọn phường hoặc xã",
  searchLabel: "Tìm phường hoặc xã",
  searchHint: "Gõ tên, không cần dấu",
  listLabel: "Danh sách phường, xã",
  resultCount: (count: number) =>
    count === 0 ? "Không có kết quả" : `${count} kết quả`,
  chosen: ", đã chọn",
  errorTitle: "Không tải được danh sách phường, xã",
  retry: "Thử lại",
  // Shown on the button while the catalog is missing, so the code is not called "unknown".
  codeOnly: (code: string) => `Mã ${code}`,
  unknownCode: (code: string) => `Mã ${code} (không có trong danh sách)`,
  noMatch: (typed: string) =>
    `Không có phường, xã nào khớp “${typed.slice(0, ECHO_LENGTH)}”. Thử gõ ít chữ hơn.`,
} as const;
