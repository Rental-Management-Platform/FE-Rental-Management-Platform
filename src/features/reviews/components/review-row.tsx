import { StarRating } from "@/components/star-rating";
import type { PublicReview } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { authorName, hasComment, isEdited } from "../text";

/**
 * One review of the public list (spec 0013, AC-4): the stars, the author, the date, a small
 * "Đã chỉnh sửa" when it was changed, and the comment. The comment is plain text: `pre-wrap` keeps
 * the line breaks, `break-words` keeps a long word inside the row, and it is never read as HTML. A
 * row is not a card, because a card never sits inside another card (spec 0004): it is a `li` with
 * a divider.
 */
export function ReviewRow({ review }: { review: PublicReview }) {
  return (
    <li className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarRating value={review.stars} />
        <span className="min-w-0 font-medium break-words">
          {authorName(review.author.name)}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
          <time dateTime={review.createdAt}>
            {formatDateTime(review.createdAt)}
          </time>
          {isEdited(review) && <span>Đã chỉnh sửa</span>}
        </span>
      </div>
      {hasComment(review.comment) && (
        <p className="break-words whitespace-pre-wrap">{review.comment}</p>
      )}
    </li>
  );
}
