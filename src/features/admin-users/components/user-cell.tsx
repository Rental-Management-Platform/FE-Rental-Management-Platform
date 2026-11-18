import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AdminUserListItem } from "@/lib/api/types";
import { NO_NAME } from "../admin-users-text";

/**
 * Who an account is: the name (or "Chưa đặt tên") and under it the email. The email is the one
 * thing that tells two people apart, so it is always there and carries the full text in `title`
 * when a long one is cut. The avatar is only a first letter and is hidden from a screen reader.
 */
export function UserCell({
  user,
}: {
  user: Pick<AdminUserListItem, "name" | "email">;
}) {
  const name = user.name?.trim() ? user.name.trim() : NO_NAME;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar aria-hidden="true">
        <AvatarFallback>
          {(user.name?.trim() || user.email).charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium" title={name}>
          {name}
        </span>
        <span
          className="truncate text-sm text-muted-foreground"
          title={user.email}
        >
          {user.email}
        </span>
      </div>
    </div>
  );
}
