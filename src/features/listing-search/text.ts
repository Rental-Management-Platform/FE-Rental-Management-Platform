// Words shared by the page header, the heading of the results and the page metadata, so the
// same text is on the screen and in the tab and in the search result (spec 0009, AC-12).

/** The one line under the title of the plain list page, and its meta description. */
export const LISTING_LIST_DESCRIPTION =
  "Phòng trọ, nhà cho thuê và căn hộ mini do chủ trọ đăng trực tiếp. Tìm theo tên đường, phường hoặc từ khóa.";

/** The title and the description of a page with a filter or an order but no keyword (spec 0016, AC-16). */
export const FILTERED_LIST_TITLE = "Kết quả lọc phòng trọ";
export const filteredListDescription = (siteName: string) =>
  `Danh sách phòng trọ đã lọc hoặc sắp xếp trên ${siteName}.`;

/** The three orders, as the sort links name them (spec 0016, AC-13). */
export const SORT_LABELS = {
  newest: "Mới đăng trước",
  price_asc: "Giá tăng dần",
  price_desc: "Giá giảm dần",
} as const;

/** The notice for a price range turned the wrong way round (spec 0016, AC-4). */
export const PRICE_RANGE_NOTICE = {
  title: "Khoảng giá chưa hợp lệ",
  description:
    "Giá từ đang lớn hơn giá đến, nên chưa tìm được. Hãy sửa lại khoảng giá.",
  fix: "Bỏ khoảng giá",
} as const;

/**
 * What the empty state says when nothing matches, by what is set (spec 0016, AC-14). The caller
 * only asks this when there is a keyword, a filter or both.
 */
export function noMatchHint(keyword: boolean, filters: boolean): string {
  if (keyword && filters) {
    return "Thử đổi từ khóa hoặc bỏ bớt bộ lọc để xem thêm phòng.";
  }
  return keyword
    ? "Thử đổi từ khóa để xem thêm phòng."
    : "Thử bỏ bớt bộ lọc để xem thêm phòng.";
}

// A keyword in a heading or a title is cut, so a long one cannot push the count off the screen.
const SHOWN_KEYWORD_LENGTH = 60;

/** The keyword as shown in a heading or a title: at most 60 characters, then "…". */
export function shortKeyword(q: string): string {
  const characters = Array.from(q);
  return characters.length > SHOWN_KEYWORD_LENGTH
    ? `${characters.slice(0, SHOWN_KEYWORD_LENGTH).join("")}…`
    : q;
}
