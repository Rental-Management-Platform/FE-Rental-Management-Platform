import type { PublicReview } from "@/lib/api/types";
import { ReviewRow } from "./review-row";

type ReviewListProps = {
  rows: readonly PublicReview[];
  /** The next page is loading and these rows are the old ones: marks the list busy. */
  busy: boolean;
};

/**
 * The rows of one page (spec 0013, AC-4), in the order the API gives them (newest first), with a
 * divider between them. It only draws, so `/dev/ui` can show it on fake rows. The viewer's own
 * review is not here: it is pinned above the list.
 */
export function ReviewList({ rows, busy }: ReviewListProps) {
  return (
    <ul aria-busy={busy} className="flex flex-col divide-y">
      {rows.map((review) => (
        <ReviewRow key={review.id} review={review} />
      ))}
    </ul>
  );
}
