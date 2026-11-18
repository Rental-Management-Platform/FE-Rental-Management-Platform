import { LockIcon, LockOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminUserListItem } from "@/lib/api/types";
import {
  LOCK_BUTTON,
  MY_ACCOUNT,
  UNLOCK_BUTTON,
  lockButtonName,
  unlockButtonName,
} from "../admin-users-text";
import type { RowActions } from "../row-actions";

/**
 * The buttons of one row (scope #20, spec 0023, AC-5), as `rowActions` decided them: the viewer's
 * own row says "Tài khoản của bạn" and has no button, an active account has "Khóa", a locked one
 * only "Mở khóa". Every name carries the email of the row, so a screen reader that lists the
 * buttons of the page can tell them apart. `data-user-actions` is how the lock dialog finds a
 * button of the same row to give focus back to when the one that opened it is gone.
 */
export function UserRowActions({
  user,
  actions,
  size,
  onLock,
  onUnlock,
}: {
  user: AdminUserListItem;
  actions: RowActions;
  /** 32 px in the table, 44 px in the blocks. */
  size: "sm" | "lg";
  onLock: (user: AdminUserListItem) => void;
  onUnlock: (user: AdminUserListItem) => void;
}) {
  if (actions.mine) {
    return <span className="text-sm text-muted-foreground">{MY_ACCOUNT}</span>;
  }
  return (
    <div
      data-user-actions={user.id}
      className="flex flex-wrap items-center gap-2 empty:hidden"
    >
      {actions.lock && (
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={lockButtonName(user.email)}
          onClick={() => onLock(user)}
        >
          <LockIcon data-icon="inline-start" aria-hidden="true" />
          {LOCK_BUTTON}
        </Button>
      )}
      {actions.unlock && (
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={unlockButtonName(user.email)}
          onClick={() => onUnlock(user)}
        >
          <LockOpenIcon data-icon="inline-start" aria-hidden="true" />
          {UNLOCK_BUTTON}
        </Button>
      )}
    </div>
  );
}
