import { CheckIcon, ShieldAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReviewRow } from "../review-row";
import { STATUS_HIDDEN_BY_ADMIN, STATUS_VISIBLE } from "../admin-reviews-text";

/**
 * The status of a review: words with an icon, never color alone. It is only the badge. The reason
 * an admin gave when hiding is read in "Xem chi tiết" (`ReviewRowActions`), so a hidden row is as
 * tall as a visible one.
 */
export function ReviewStatus({
  review,
}: {
  review: Pick<ReviewRow, "status">;
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
    <Badge variant="destructive">
      <ShieldAlertIcon data-icon="inline-start" aria-hidden="true" />
      {STATUS_HIDDEN_BY_ADMIN}
    </Badge>
  );
}
