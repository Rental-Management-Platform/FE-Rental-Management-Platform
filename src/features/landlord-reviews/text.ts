// The words and small rules of the reviews zone that more than one component uses (spec 0013).

import type { IsoDateTime } from "@/lib/api/types";
import { formatCount } from "@/lib/format";

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

/** A comment is shown only when it has something in it. */
export const hasComment = (comment: string | null): comment is string =>
  comment !== null && comment.trim() !== "";
