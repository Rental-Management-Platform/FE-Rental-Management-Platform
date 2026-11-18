import { CheckIcon, ShieldAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReviewRow } from "../review-row";
import {
  STATUS_HIDDEN_BY_ADMIN,
  STATUS_VISIBLE,
  hiddenReasonLine,
} from "../admin-reviews-text";

/**
 * The status of a review: words with an icon, never color alone. A review an admin hid also shows
 * its whole `hiddenReason`, wrapped inside the cell, because the reason is what an admin needs to
 * decide about an unhide. The reason is the text an admin typed, so it is shown as plain text. It is
 * only set while the status is `hidden_by_admin` (api 6.40), so it is never shown for a review that
 * shows.
 */
export function ReviewStatus({
  review,
}: {
  review: Pick<ReviewRow, "status" | "hiddenReason">;
}) {
  if (review.status === "visible") {
    return (
      <Badge variant="success">
        <CheckIcon data-icon="inline-start" aria-hidden="true" />
        {STATUS_VISIBLE}
      </Badge>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant="destructive">
        <ShieldAlertIcon data-icon="inline-start" aria-hidden="true" />
        {STATUS_HIDDEN_BY_ADMIN}
      </Badge>
      {review.hiddenReason !== null && (
        <p className="max-w-64 text-sm break-words whitespace-normal">
          {hiddenReasonLine(review.hiddenReason)}
        </p>
      )}
    </div>
  );
}
