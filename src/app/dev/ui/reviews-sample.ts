// Fake data for the reviews preview (spec 0013, AC-21). Fixed objects typed with the API types, so
// a wrong field fails `npm run typecheck`. Nothing here calls the network. No randomness, so the
// page looks the same on every load.

import { REVIEWS_PAGE_SIZE } from "@/features/landlord-reviews/review-list";
import type { MyReview, Page, PublicReview } from "@/lib/api/types";

/** The address a sign in row sends back to. */
export const SAMPLE_PATH = "/chu-tro/0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8d01";

const NAMES: readonly (string | null)[] = [
  "Bùi Anh Tuấn",
  "Nguyễn Thị Lan Anh",
  "Trần Quốc Việt",
  "Huỳnh Thanh Trúc",
  "Lê Hoàng Yến",
  null,
  "Phạm Đức Thịnh",
  "Võ Ngọc Diệp",
  "Đặng Minh Quân",
];

// Plain comments, a null one (stars only), several lines, and text that looks like HTML. The last
// one is a single word with no break, to show a long word staying inside its row.
const COMMENTS: readonly (string | null)[] = [
  "Chủ trọ phản hồi nhanh, hợp đồng ghi rõ giá điện.",
  "Phòng có cửa sổ lớn, giờ giấc tự do. Nhà vệ sinh hơi nhỏ.",
  null,
  "Dòng một của nhận xét.\nDòng hai, ngay dưới.\n\nDòng bốn sau một dòng trống.",
  "Ổn, chỉ có điều bãi xe hơi nhỏ.",
  '<img src="x" onerror="alert(1)"> <b>chữ trông như mã HTML</b> hiện nguyên văn, không phải thẻ.',
  "Chị chủ rất nhiệt tình, còn giúp mình tìm thêm bạn ở ghép.",
  "Phongmoixaydungthoangmatchutrodechiutramlongdauchulongnhungkhongvuotrakhoiohangnhanxet.",
];

const STARS = [5, 4, 5, 3, 4, 5, 2, 4, 5, 4];

const DAY_MS = 86_400_000;
const NEWEST = Date.UTC(2026, 10, 1, 3, 0, 0);

function sampleReview(index: number): PublicReview {
  const createdAt = new Date(NEWEST - index * 2 * DAY_MS).toISOString();
  // Every seventh review was edited later, which shows "Đã chỉnh sửa".
  const updatedAt =
    index % 7 === 3
      ? new Date(NEWEST - index * 2 * DAY_MS + 3 * DAY_MS).toISOString()
      : createdAt;
  return {
    id: `0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8e${String(index).padStart(2, "0")}`,
    stars: STARS[index % STARS.length],
    comment: COMMENTS[index % COMMENTS.length],
    author: { name: NAMES[index % NAMES.length] },
    isMine: null,
    createdAt,
    updatedAt,
  };
}

/** 25 visible reviews, newest first, as a guest sees them (`isMine` is `null`). */
export const SAMPLE_REVIEWS: readonly PublicReview[] = Array.from(
  { length: 25 },
  (_, index) => sampleReview(index),
);

/**
 * 21 visible reviews as a signed in renter sees them: the oldest is theirs (`isMine` is `true`).
 * With 10 a page, page 3 holds only that one, which is already pinned above the list, so the page
 * has nothing else to show.
 */
export const SAMPLE_REVIEWS_ONLY_MINE_LAST: readonly PublicReview[] =
  Array.from({ length: 21 }, (_, index) => ({
    ...sampleReview(index),
    isMine: index === 20,
  }));

/** The answer of `GET /landlords/:id/reviews?page=<page>` for a list, sliced the way the API does. */
export function pageOf(
  reviews: readonly PublicReview[],
  page: number,
): Page<PublicReview> {
  const from = (page - 1) * REVIEWS_PAGE_SIZE;
  return {
    items: reviews.slice(from, from + REVIEWS_PAGE_SIZE),
    total: reviews.length,
    page,
    pageSize: REVIEWS_PAGE_SIZE,
  };
}

/** My own visible review, as `GET /landlords/:id/review` gives it. */
export const SAMPLE_MY_REVIEW: MyReview = {
  id: "0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8f01",
  stars: 4,
  comment:
    "Phòng sạch, chủ trọ dễ nói chuyện.\nGiá điện tính theo giá nhà nước.",
  status: "visible",
  hiddenReason: null,
  createdAt: new Date(NEWEST - 2 * DAY_MS).toISOString(),
  updatedAt: new Date(NEWEST - 2 * DAY_MS).toISOString(),
};

/** My review after an admin hid it: it carries the last reason they gave. */
export const SAMPLE_MY_REVIEW_HIDDEN: MyReview = {
  ...SAMPLE_MY_REVIEW,
  id: "0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8f02",
  stars: 1,
  comment: "Chủ trọ nói chuyện thiếu tôn trọng, đừng thuê chỗ này!!!",
  status: "hidden_by_admin",
  hiddenReason: "Nội dung xúc phạm cá nhân.",
};

/** A comment past the limit of 1000 characters, for the form's count and its message. */
export const SAMPLE_TOO_LONG_COMMENT = "Rất tốt. ".repeat(112);
