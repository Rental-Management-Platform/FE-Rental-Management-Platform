import { hasComment } from "@/features/reviews/text";
import { cn } from "@/lib/utils";
import { NO_COMMENT } from "../admin-reviews-text";

/**
 * The comment of a review. It is plain text with its line breaks, never HTML (api 6.40: the backend
 * stores it raw and does not filter it), and a long word wraps instead of widening the row. A
 * review may have no comment. In a row (`clamp`) only the first two lines show, so no row grows
 * taller than the others; "Xem chi tiết" shows the whole comment, because an admin decides on the
 * words.
 */
export function ReviewComment({
  comment,
  clamp = false,
}: {
  comment: string | null;
  clamp?: boolean;
}) {
  if (!hasComment(comment)) {
    return <span className="text-muted-foreground">{NO_COMMENT}</span>;
  }
  return (
    <p
      className={cn(
        "text-sm break-words whitespace-pre-line",
        clamp && "line-clamp-2",
      )}
    >
      {comment}
    </p>
  );
}
