"use client";

import { useId, type Ref } from "react";
import { StarRating } from "@/components/star-rating";
import type { MyReview } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { hasComment, isEdited } from "../text";

type MyReviewRowProps = {
  review: MyReview;
  /** On the heading, so a write can move focus here once the row has appeared (AC-8). */
  headingRef: Ref<HTMLHeadingElement>;
};

/**
 * My own review, pinned at the top of the zone (spec 0013, AC-5): a highlighted row (`bg-accent`,
 * a tint and not a second card) labelled "Đánh giá của bạn". The heading takes focus after a write
 * (`tabIndex={-1}`: a focus target, not a control). The comment is plain text.
 */
export function MyReviewRow({ review, headingRef }: MyReviewRowProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 rounded-lg bg-accent p-4"
    >
      <h3
        ref={headingRef}
        id={headingId}
        tabIndex={-1}
        className="text-base outline-hidden"
      >
        Đánh giá của bạn
      </h3>
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
    </section>
  );
}
