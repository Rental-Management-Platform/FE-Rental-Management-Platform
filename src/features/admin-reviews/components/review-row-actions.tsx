import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  DetailItem,
  DetailList,
  RowDetail,
} from "@/components/detail/row-detail";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import {
  COLUMN_AUTHOR,
  COLUMN_COMMENT,
  COLUMN_STARS,
  COLUMN_STATUS,
  COLUMN_WRITTEN,
  DETAIL_TITLE,
  HIDDEN_REASON_LABEL,
  HIDE_BUTTON,
  NO_REASON,
  UNHIDE_BUTTON,
  hideButtonName,
  unhideButtonName,
} from "../admin-reviews-text";
import type { ReviewRow } from "../review-row";
import { reviewActionOf } from "../review-rule";
import { ReviewComment } from "./review-comment";
import { ReviewStatus } from "./review-status";

/**
 * "Xem chi tiết" of one review: everything the row leaves out, above all the whole comment and the
 * reason an admin gave when hiding. Both are text a person typed, so they are shown as plain text
 * with their line breaks. The reason is only set while the status is `hidden_by_admin` (api 6.40),
 * so it is never shown for a review that shows.
 */
function ReviewDetail<Row extends ReviewRow>({
  review,
  about,
  author,
  subjectLabel,
  subject,
  size,
}: {
  review: Row;
  about: string;
  author: string;
  subjectLabel: string;
  subject: string;
  size: "sm" | "lg";
}) {
  return (
    <RowDetail name={about} title={DETAIL_TITLE} size={size}>
      <DetailList>
        <DetailItem label={COLUMN_STARS}>
          <StarRating value={review.stars} />
        </DetailItem>
        <DetailItem label={COLUMN_COMMENT}>
          <ReviewComment comment={review.comment} />
        </DetailItem>
        <DetailItem label={COLUMN_AUTHOR}>{author}</DetailItem>
        <DetailItem label={subjectLabel}>{subject}</DetailItem>
        <DetailItem label={COLUMN_WRITTEN}>
          {formatDateTime(review.createdAt)}
        </DetailItem>
        <DetailItem label={COLUMN_STATUS}>
          <ReviewStatus review={review} />
        </DetailItem>
        {review.status === "hidden_by_admin" && (
          <DetailItem label={HIDDEN_REASON_LABEL}>
            {review.hiddenReason ?? NO_REASON}
          </DetailItem>
        )}
      </DetailList>
    </RowDetail>
  );
}

/**
 * The buttons of one row, as `reviewActionOf` decided them: "Ẩn" for a review that shows, "Gỡ ẩn" for
 * one an admin hid, then "Xem chi tiết". The names say whose review it is and about what (`about`),
 * so a screen reader that lists the buttons of the page can tell them apart. `data-review-actions`
 * is how a dialog finds the button of the same row to give focus back to when the one that opened
 * it is gone.
 */
export function ReviewRowActions<Row extends ReviewRow>({
  review,
  about,
  author,
  subjectLabel,
  subject,
  size,
  onHide,
  onUnhide,
}: {
  review: Row;
  /** "của Bạn Lan về Anh Minh". */
  about: string;
  /** The name of the writer, for the dialog of "Xem chi tiết". */
  author: string;
  /** What the review is about, such as "Chủ trọ", and its name. */
  subjectLabel: string;
  subject: string;
  /** 32 px in the table, 44 px in the blocks. */
  size: "sm" | "lg";
  onHide: (review: Row) => void;
  onUnhide: (review: Row) => void;
}) {
  const unhide = reviewActionOf(review.status) === "unhide";
  return (
    <div
      data-review-actions={review.id}
      className="flex flex-wrap items-center gap-2"
    >
      <Button
        type="button"
        variant="outline"
        size={size}
        aria-label={unhide ? unhideButtonName(about) : hideButtonName(about)}
        onClick={() => (unhide ? onUnhide(review) : onHide(review))}
      >
        {unhide ? (
          <EyeIcon data-icon="inline-start" aria-hidden="true" />
        ) : (
          <EyeOffIcon data-icon="inline-start" aria-hidden="true" />
        )}
        {unhide ? UNHIDE_BUTTON : HIDE_BUTTON}
      </Button>
      <ReviewDetail
        review={review}
        about={about}
        author={author}
        subjectLabel={subjectLabel}
        subject={subject}
        size={size}
      />
    </div>
  );
}
