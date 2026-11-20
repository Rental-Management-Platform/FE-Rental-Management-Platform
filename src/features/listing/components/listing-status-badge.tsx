import {
  CheckIcon,
  EyeOffIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  HOLD_BACK_LINE,
  type HoldBackCause,
} from "@/features/membership/membership-text";
import type { ListingStatus } from "@/lib/api/types";

interface ListingStatusBadgeProps {
  status: ListingStatus;
  /** From the same answer as `status`: a `visible` listing can still be held back from guests. */
  isPublic: boolean;
  /**
   * Whether the sentence under a held back listing is drawn. A row of a list leaves it out (it is
   * only the badge) and "Xem chi tiết" shows it; a page about one listing keeps it.
   */
  showReason?: boolean;
  /**
   * Why a held back listing is held back, read from the shared membership (`useHoldBackCause`).
   * `null` or absent when it is not known, and the reason line then names both causes.
   */
  cause?: HoldBackCause | null;
}

// A status is always words with an icon, never color alone. `visible` splits in two: shown to
// guests, or held back because the landlord is over the listing limit or has no trial and no
// plan. The backend does not say which, so the caller passes the cause it read from the shared
// membership (spec 0020, AC-10); without it the reason line names both causes (spec 0006). The
// label does not change with the cause, because it is scanned in a table. The list of my
// listings reuses this label (spec 0019, AC-2).
export function ListingStatusBadge({
  status,
  isPublic,
  showReason = true,
  cause = null,
}: ListingStatusBadgeProps) {
  if (status === "visible" && isPublic) {
    return (
      <Badge variant="success">
        <CheckIcon data-icon="inline-start" />
        Đang hiện với khách
      </Badge>
    );
  }
  if (status === "visible") {
    return (
      <div className="flex flex-col items-start gap-1">
        <Badge variant="warning">
          <TriangleAlertIcon data-icon="inline-start" />
          Đang bị ẩn bớt khỏi khách
        </Badge>
        {showReason && (
          <p className="max-w-md text-sm text-muted-foreground">
            {cause !== null
              ? HOLD_BACK_LINE[cause]
              : "Tin vẫn tính vào số tin đang hiện nhưng khách chưa thấy, vì vượt hạn mức hoặc hết dùng thử."}
          </p>
        )}
      </div>
    );
  }
  if (status === "hidden_by_owner") {
    return (
      <Badge variant="secondary">
        <EyeOffIcon data-icon="inline-start" />
        Bạn đã ẩn
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <ShieldAlertIcon data-icon="inline-start" />
      Admin đã ẩn
    </Badge>
  );
}
