// The words the search picker says by itself. What it is a picker of (its labels, the empty
// message) comes from the feature that uses it.

export const SEARCH_PICKER_TEXT = {
  searching: "Đang tìm",
  resultCount: (count: number) =>
    count === 0 ? "Không có kết quả" : `${count} kết quả`,
  chosen: ", đã chọn",
  retry: "Thử lại",
} as const;
