"use client";

import { useEffect, useId, type Ref } from "react";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MyReview } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { useReviewForm } from "../hooks/use-review-form";
import { valuesOfReview, type ReviewValues } from "../schemas/review-schema";
import { hasComment, isEdited } from "../text";
import { ReviewForm } from "./review-form";

const ROW_CLASS = "flex flex-col gap-3 rounded-lg bg-accent p-4";
const HEADING_CLASS = "text-base outline-hidden";

type MyReviewRowProps = {
  review: MyReview;
  /** On the heading, so a write can move focus here once the row has appeared (AC-8). */
  headingRef: Ref<HTMLHeadingElement>;
  /** On "Sửa", so closing the editor can move focus back to it (AC-9). */
  editRef: Ref<HTMLButtonElement>;
  /** Both need the permission (`review:update`, `review:delete`); a hidden review is never edited. */
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

/**
 * My own review, pinned at the top of the zone (spec 0013, AC-5): a highlighted row (`bg-accent`,
 * a tint and not a second card) labelled "Đánh giá của bạn", and the only place with "Sửa" and
 * "Xóa". The heading takes focus after a write (`tabIndex={-1}`: a focus target, not a control).
 * The comment and the reason an admin gave are plain text.
 *
 * When an admin hid the review the row says so in words (a badge, a line and the reason), because
 * nobody else sees it, and only "Xóa" is left: the backend answers 409 to an edit of a hidden
 * review.
 */
export function MyReviewRow({
  review,
  headingRef,
  editRef,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: MyReviewRowProps) {
  const headingId = useId();
  const hidden = review.status === "hidden_by_admin";
  const showEdit = canUpdate && !hidden;
  const reason = hasComment(review.hiddenReason) ? review.hiddenReason : null;

  return (
    <section aria-labelledby={headingId} className={ROW_CLASS}>
      <h3
        ref={headingRef}
        id={headingId}
        tabIndex={-1}
        className={HEADING_CLASS}
      >
        Đánh giá của bạn
      </h3>

      {hidden && (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="warning">Bị quản trị viên ẩn</Badge>
          <p>Đánh giá này không hiện với mọi người.</p>
          {reason !== null && (
            <p className="text-sm break-words">Lý do: {reason}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarRating value={review.stars} />
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

      {(showEdit || canDelete) && (
        <div className="flex flex-wrap gap-2">
          {showEdit && (
            <Button
              ref={editRef}
              type="button"
              variant="outline"
              size="lg"
              onClick={onEdit}
            >
              Sửa
            </Button>
          )}
          {canDelete && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onDelete}
            >
              Xóa
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

type MyReviewEditorProps = {
  review: MyReview;
  /** Sends the changed fields, or closes with no request when nothing changed. */
  onSave: (values: ReviewValues) => Promise<unknown>;
  onCancel: () => void;
};

/**
 * The pinned row opened for editing (spec 0013, AC-9): the same form, filled with the current
 * stars and comment, with "Lưu thay đổi" and "Hủy". Its form state exists only while it is open,
 * so "Hủy" drops the draft and the next "Sửa" starts from the saved review again. Focus goes to the
 * stars when it opens.
 */
export function MyReviewEditor({
  review,
  onSave,
  onCancel,
}: MyReviewEditorProps) {
  const headingId = useId();
  const state = useReviewForm(valuesOfReview(review));
  const { setFocus } = state.form;

  useEffect(() => {
    setFocus("stars");
  }, [setFocus]);

  return (
    <section aria-labelledby={headingId} className={ROW_CLASS}>
      <h3 id={headingId} className={HEADING_CLASS}>
        Đánh giá của bạn
      </h3>
      <ReviewForm
        state={state}
        mode="edit"
        onSubmit={onSave}
        onCancel={onCancel}
      />
    </section>
  );
}
