import { CheckIcon, EyeOffIcon, ShieldAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ModerationListing } from "@/lib/api/types";
import {
  STATUS_HIDDEN_BY_ADMIN,
  STATUS_HIDDEN_BY_OWNER,
  STATUS_VISIBLE,
} from "../admin-listings-text";

/**
 * The status of a listing: words with an icon, never color alone. It is only the badge. The reason
 * an admin gave when hiding is read in "Xem chi tiết" (`ModerationRowActions`), so a hidden row is as
 * tall as a visible one.
 */
export function ModerationStatus({
  listing,
}: {
  listing: Pick<ModerationListing, "status">;
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
    <Badge variant="destructive">
      <ShieldAlertIcon data-icon="inline-start" aria-hidden="true" />
      {STATUS_HIDDEN_BY_ADMIN}
    </Badge>
  );
}
