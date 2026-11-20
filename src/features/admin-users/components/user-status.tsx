import { CheckIcon, LockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminUserListItem } from "@/lib/api/types";
import { STATUS_ACTIVE, STATUS_LOCKED } from "../admin-users-text";

/**
 * The status of an account: words with an icon, never color alone. It is only the badge. The
 * reason an admin gave when locking is read in "Xem chi tiết" (`UserRowActions`), so a locked row
 * is as tall as an active one.
 */
export function UserStatus({
  user,
}: {
  user: Pick<AdminUserListItem, "status">;
}) {
  if (user.status === "active") {
    return (
      <Badge variant="success">
        <CheckIcon data-icon="inline-start" aria-hidden="true" />
        {STATUS_ACTIVE}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">
      <LockIcon data-icon="inline-start" aria-hidden="true" />
      {STATUS_LOCKED}
    </Badge>
  );
}
