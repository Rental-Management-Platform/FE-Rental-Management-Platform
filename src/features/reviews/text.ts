// The words and small rules of the reviews zone that more than one component uses (spec 0013).

import type { IsoDateTime } from "@/lib/api/types";
import { formatCount, formatRating } from "@/lib/format";

/** What an author is called when the account has no name (AC-4). */
export const AUTHOR_FALLBACK = "Người dùng";

/** The name to show for the author of a review: the account name, or "Người dùng". */
export const authorName = (name: string | null): string =>
  name !== null && name.trim() !== "" ? name : AUTHOR_FALLBACK;

/** True when a review was changed after it was written, which shows "Đã chỉnh sửa" (AC-4). */
export const isEdited = (review: {
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}): boolean => review.updatedAt !== review.createdAt;

/**
 * The count under the heading (AC-1), from `reviewCount` of the profile: "12 đánh giá", or
 * "Chưa có đánh giá" when it is 0. It is never the length of the list.
 */
export const reviewCountText = (count: number): string =>
  count <= 0 ? "Chưa có đánh giá" : `${formatCount(count)} đánh giá`;

/**
 * The line next to the stars (spec 0013, AC-20, and spec 0014, AC-3): "4,3 (12 đánh giá)", or
 * "Chưa có đánh giá" when there is no review. It never shows a score of 0, because the contract
 * gives `null` for it.
 */
export function ratingText(
  reviewCount: number,
  ratingAverage: number | null,
): string {
  if (reviewCount <= 0 || ratingAverage === null) return "Chưa có đánh giá";
  return `${formatRating(ratingAverage)} (${formatCount(reviewCount)} đánh giá)`;
}

/** A comment is shown only when it has something in it. */
export const hasComment = (comment: string | null): comment is string =>
  comment !== null && comment.trim() !== "";
