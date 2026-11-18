import { CheckIcon, LockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminUserListItem } from "@/lib/api/types";
import {
  STATUS_ACTIVE,
  STATUS_LOCKED,
  lockedReasonLine,
} from "../admin-users-text";

/**
 * The status of an account: words with an icon, never color alone. A locked account also shows
 * its whole `lockedReason`, wrapped inside the cell, because the reason is what an admin needs to
 * decide about an unlock. The reason is the text one admin typed, so it is shown as plain text.
 */
export function UserStatus({
  user,
}: {
  user: Pick<AdminUserListItem, "status" | "lockedReason">;
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
    <div className="flex flex-col items-start gap-1">
      <Badge variant="destructive">
        <LockIcon data-icon="inline-start" aria-hidden="true" />
        {STATUS_LOCKED}
      </Badge>
      {user.lockedReason !== null && (
        <p className="max-w-64 text-sm break-words whitespace-normal">
          {lockedReasonLine(user.lockedReason)}
        </p>
      )}
    </div>
  );
}
