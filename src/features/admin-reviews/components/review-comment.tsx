import { hasComment } from "@/features/reviews/text";
import { NO_COMMENT } from "../admin-reviews-text";

/**
 * The comment of a review, whole, because an admin decides on the words. It is plain text with its
 * line breaks, never HTML (api 6.40: the backend stores it raw and does not filter it), and a long
 * word wraps instead of widening the row. A review may have no comment.
 */
export function ReviewComment({ comment }: { comment: string | null }) {
  if (!hasComment(comment)) {
    return <span className="text-muted-foreground">{NO_COMMENT}</span>;
  }
  return <p className="text-sm break-words whitespace-pre-line">{comment}</p>;
}
