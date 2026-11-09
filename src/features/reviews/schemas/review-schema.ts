import { z } from "zod";
import type { DefaultValues } from "react-hook-form";
import type {
  CreateReviewBody,
  MyReview,
  UpdateReviewBody,
} from "@/lib/api/types";

/** The longest comment the backend takes, in characters (api-for-frontend.md, 6.40). */
export const COMMENT_MAX = 1000;

/**
 * How long a comment is, as the backend counts it: Unicode characters of the text with its ends
 * trimmed. It is the rule of `messageLength` in chat (spec 0012): `Array.from` walks code points,
 * so one emoji is one character.
 */
export const commentLength = (text: string): number =>
  Array.from(text.trim()).length;

const STARS_MESSAGE = "Hãy chọn số sao.";

/**
 * The review form (spec 0013, AC-7). `stars` has no value at the start, so a missing value, a
 * fraction and anything outside 1 to 5 all say the same sentence. `comment` may be empty (it is
 * optional), and whitespace only counts as empty.
 */
export const reviewSchema = z.object({
  stars: z
    .number(STARS_MESSAGE)
    .int(STARS_MESSAGE)
    .min(1, STARS_MESSAGE)
    .max(5, STARS_MESSAGE),
  comment: z.string().refine((text) => commentLength(text) <= COMMENT_MAX, {
    message: `Nhận xét dài tối đa ${COMMENT_MAX} ký tự.`,
  }),
});

export type ReviewValues = z.infer<typeof reviewSchema>;

/** What an empty form starts with, and what a posted review resets it to: no stars chosen. */
export const EMPTY_REVIEW: DefaultValues<ReviewValues> = { comment: "" };

/** The form values of a review that already exists, for the editor. */
export const valuesOfReview = (
  review: Pick<MyReview, "stars" | "comment">,
): ReviewValues => ({ stars: review.stars, comment: review.comment ?? "" });

// A comment that is empty after trimming is no comment.
const isBlank = (text: string | null): text is null | "" =>
  text === null || text.trim() === "";

/**
 * The body of `POST /landlords/:id/review` (AC-8). The comment is left out when it is empty after
 * trimming, and otherwise it is sent as typed.
 */
export function toCreateBody({
  stars,
  comment,
}: ReviewValues): CreateReviewBody {
  return isBlank(comment) ? { stars } : { stars, comment };
}

/**
 * The body of `PATCH /landlords/:id/review` (AC-9): only the fields that changed, or `null` when
 * nothing did, so the editor closes without a request. The backend moves `updatedAt` even for an
 * identical value, which would show a false "Đã chỉnh sửa".
 *
 * A comment counts as changed when its trimmed text differs: adding a space at the end is not an
 * edit. A comment that is empty after trimming is sent as `null`, which clears it.
 */
export function toPatchBody(
  { stars, comment }: ReviewValues,
  current: Pick<MyReview, "stars" | "comment">,
): UpdateReviewBody | null {
  const trimmed = (text: string | null) => (isBlank(text) ? null : text.trim());
  const starsChanged = stars !== current.stars;
  const commentChanged = trimmed(comment) !== trimmed(current.comment);
  if (!starsChanged && !commentChanged) return null;

  return {
    ...(starsChanged ? { stars } : {}),
    ...(commentChanged ? { comment: isBlank(comment) ? null : comment } : {}),
  };
}
