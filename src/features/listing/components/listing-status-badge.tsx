import {
  CheckIcon,
  EyeOffIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ListingStatus } from "@/lib/api/types";

interface ListingStatusBadgeProps {
  status: ListingStatus;
  /** From the same answer as `status`: a `visible` listing can still be held back from guests. */
  isPublic: boolean;
}

// A status is always words with an icon, never color alone. `visible` splits in two: shown to
// guests, or held back because the landlord is over the listing limit or has no trial and no
// plan. The backend does not say which until #17 reads the membership, so the reason line names
// both causes (spec 0006). #12 reuses this label in the list of my listings.
export function ListingStatusBadge({
  status,
  isPublic,
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
        <p className="max-w-md text-sm text-muted-foreground">
          Tin vẫn tính vào số tin đang hiện nhưng khách chưa thấy, vì vượt hạn
          mức hoặc hết dùng thử.
        </p>
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
