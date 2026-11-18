import { CheckIcon, EyeOffIcon, ShieldAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ModerationListing } from "@/lib/api/types";
import {
  STATUS_HIDDEN_BY_ADMIN,
  STATUS_HIDDEN_BY_OWNER,
  STATUS_VISIBLE,
  moderationReasonLine,
} from "../admin-listings-text";

/**
 * The status of a listing: words with an icon, never color alone. A listing an admin hid also shows
 * its whole `moderationReason`, wrapped inside the cell, because the reason is what an admin needs
 * to decide about an unhide. The reason is the text an admin typed, so it is shown as plain text.
 * The reason is only set while the status is `hidden_by_admin` (api 6.29), so it is never shown
 * for another status.
 */
export function ModerationStatus({
  listing,
}: {
  listing: Pick<ModerationListing, "status" | "moderationReason">;
}) {
  if (listing.status === "visible") {
    return (
      <Badge variant="success">
        <CheckIcon data-icon="inline-start" aria-hidden="true" />
        {STATUS_VISIBLE}
      </Badge>
    );
  }
  if (listing.status === "hidden_by_owner") {
    return (
      <Badge variant="secondary">
        <EyeOffIcon data-icon="inline-start" aria-hidden="true" />
        {STATUS_HIDDEN_BY_OWNER}
      </Badge>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant="destructive">
        <ShieldAlertIcon data-icon="inline-start" aria-hidden="true" />
        {STATUS_HIDDEN_BY_ADMIN}
      </Badge>
      {listing.moderationReason !== null && (
        <p className="max-w-64 text-sm break-words whitespace-normal">
          {moderationReasonLine(listing.moderationReason)}
        </p>
      )}
    </div>
  );
}
