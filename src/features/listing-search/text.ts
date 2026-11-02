// Words shared by the page header, the heading of the results and the page metadata, so the
// same text is on the screen and in the tab and in the search result (spec 0009, AC-12).

/** The one line under the title of the plain list page, and its meta description. */
export const LISTING_LIST_DESCRIPTION =
  "Phòng trọ, nhà cho thuê và căn hộ mini do chủ trọ đăng trực tiếp. Tìm theo tên đường, phường hoặc từ khóa.";

// A keyword in a heading or a title is cut, so a long one cannot push the count off the screen.
const SHOWN_KEYWORD_LENGTH = 60;

/** The keyword as shown in a heading or a title: at most 60 characters, then "…". */
export function shortKeyword(q: string): string {
  const characters = Array.from(q);
  return characters.length > SHOWN_KEYWORD_LENGTH
    ? `${characters.slice(0, SHOWN_KEYWORD_LENGTH).join("")}…`
    : q;
}
