import type { ReactNode } from "react";
import { StarRating } from "@/components/star-rating";
import { formatDateTime } from "@/lib/format";
import { COLUMN_AUTHOR, COLUMN_WRITTEN } from "../admin-reviews-text";
import type { ReviewRow } from "../review-row";
import { ReviewComment } from "./review-comment";
import { ReviewStatus } from "./review-status";

/**
 * The list below `md` (scope #36): each review is a block that stacks. The blocks sit inside the
 * zone and are told apart by a hairline, never by a card of their own, because a card never sits
 * inside another card. It shows the same values as the table.
 */
export function ReviewCards<Row extends ReviewRow>({
  rows,
  subjectHeader,
  subject,
  author,
  actions,
}: {
  rows: readonly Row[];
  /** The label of what the review is about, such as "Chủ trọ". */
  subjectHeader: string;
  subject: (review: Row) => ReactNode;
  author: (review: Row) => ReactNode;
  /** The buttons of one row. Left out, the blocks have none. */
  actions?: (review: Row) => ReactNode;
}) {
  return (
    <ul className="flex flex-col">
      {rows.map((review) => (
        <li
          key={review.id}
          className="flex flex-col gap-3 border-t px-(--card-spacing) py-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <StarRating value={review.stars} />
            <ReviewStatus review={review} />
          </div>
          <ReviewComment comment={review.comment} />
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{COLUMN_AUTHOR}</dt>
            <dd className="min-w-0">{author(review)}</dd>
            <dt className="text-muted-foreground">{subjectHeader}</dt>
            <dd className="min-w-0">{subject(review)}</dd>
            <dt className="text-muted-foreground">{COLUMN_WRITTEN}</dt>
            <dd>{formatDateTime(review.createdAt)}</dd>
          </dl>
          {actions && <div className="empty:hidden">{actions(review)}</div>}
        </li>
      ))}
    </ul>
  );
}
