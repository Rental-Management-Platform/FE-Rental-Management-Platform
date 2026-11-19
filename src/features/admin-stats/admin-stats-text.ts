// The words of the admin overview screen (spec 0025). Pure: no React and no network. Nothing is
// worked out here beyond joining text and formatting: every number is a field of the answer. The
// words every statistics screen shares are in `src/components/stats/stats-text.ts`.

export const STATS_TITLE = "Tổng quan";
export const STATS_DESCRIPTION =
  "Số liệu của cả nền tảng: việc cần xử lý, trạng thái hiện tại và biến động theo khoảng ngày.";

export const FORBIDDEN_MESSAGE =
  "Tài khoản của bạn chưa có quyền xem tổng quan.";
export const ERROR_TITLE = "Không tải được tổng quan";

/** Views by day only exist since the day the backend began to write them (api-for-frontend.md, 6.43). */
export const VIEWS_SINCE_NOTE = "Lượt xem theo ngày tính từ 16/11/2026.";

// The strip at the top (AC-5).
export const TO_HANDLE_TITLE = "Cần xử lý";
export const NONE_TEXT = "Không có";
export const ALL_CLEAR_TEXT = "Không có gì cần xử lý";
