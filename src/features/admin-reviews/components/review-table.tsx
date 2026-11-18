import type { ReactNode } from "react";
import { StarRating } from "@/components/star-rating";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import {
  COLUMN_ACTIONS,
  COLUMN_AUTHOR,
  COLUMN_COMMENT,
  COLUMN_STARS,
  COLUMN_STATUS,
  COLUMN_WRITTEN,
} from "../admin-reviews-text";
import type { ReviewRow } from "../review-row";
import { ReviewComment } from "./review-comment";
import { ReviewStatus } from "./review-status";

/**
 * The table of reviews from `md` up (scope #36). It runs edge to edge in its zone and draws the
 * part both kinds share: stars, comment, author, date and status. What a review is about (the
 * landlord, or the listing) is the `subject` column, which the kind of list draws. Every value is
 * the row's own field, in the order the API gave: the front end sorts nothing.
 */
export function ReviewTable<Row extends ReviewRow>({
  rows,
  caption,
  subjectHeader,
  subject,
  author,
  actions,
}: {
  rows: readonly Row[];
  caption: string;
  /** The title of the column of what the review is about. */
  subjectHeader: string;
  subject: (review: Row) => ReactNode;
  author: (review: Row) => ReactNode;
  /** The buttons of one row. Left out, the table has no action column. */
  actions?: (review: Row) => ReactNode;
}) {
  return (
    <Table>
      <TableCaption className="sr-only">{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{COLUMN_STARS}</TableHead>
          <TableHead>{COLUMN_COMMENT}</TableHead>
          <TableHead>{COLUMN_AUTHOR}</TableHead>
          <TableHead>{subjectHeader}</TableHead>
          <TableHead>{COLUMN_WRITTEN}</TableHead>
          <TableHead>{COLUMN_STATUS}</TableHead>
          {actions && <TableHead>{COLUMN_ACTIONS}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((review) => (
          <TableRow key={review.id}>
            <TableCell className="align-top">
              <StarRating value={review.stars} />
            </TableCell>
            <TableCell className="max-w-96 min-w-56 align-top whitespace-normal">
              <ReviewComment comment={review.comment} />
            </TableCell>
            <TableCell className="max-w-48 align-top">
              {author(review)}
            </TableCell>
            <TableCell className="max-w-56 align-top">
              {subject(review)}
            </TableCell>
            <TableCell className="align-top">
              {formatDateTime(review.createdAt)}
            </TableCell>
            <TableCell className="align-top">
              <ReviewStatus review={review} />
            </TableCell>
            {actions && (
              <TableCell className="align-top">{actions(review)}</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
