import { LockIcon, LockOpenIcon, LogOutIcon } from "lucide-react";
import {
  DetailItem,
  DetailList,
  RowDetail,
} from "@/components/detail/row-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ACCOUNT_TYPE_LABEL } from "@/features/account/access";
import type { AdminUserListItem } from "@/lib/api/types";
import { formatDateTime, formatPhone } from "@/lib/format";
import {
  COLUMN_CREATED,
  COLUMN_PHONE,
  COLUMN_STATUS,
  COLUMN_TYPE,
  COLUMN_USER,
  DETAIL_TITLE,
  LOCK_BUTTON,
  LOCK_REASON_LABEL,
  MY_ACCOUNT_NOTE,
  NO_LOCK_REASON,
  NO_NAME,
  NO_PHONE,
  REVOKE_BUTTON,
  UNLOCK_BUTTON,
  lockButtonName,
  revokeButtonName,
  unlockButtonName,
} from "../admin-users-text";
import type { RowActions } from "../row-actions";
import { UserStatus } from "./user-status";

/**
 * "Xem chi tiết" of one account: everything the row leaves out. The reason an admin gave when
 * locking is the text that person typed, so it is shown as plain text with its line breaks.
 */
function UserDetail({
  user,
  mine,
  size,
}: {
  user: AdminUserListItem;
  mine: boolean;
  size: "sm" | "lg";
}) {
  const name = user.name?.trim() ? user.name.trim() : NO_NAME;
  return (
    <RowDetail name={user.email} title={DETAIL_TITLE} size={size}>
      <DetailList>
        <DetailItem label={COLUMN_USER}>{name}</DetailItem>
        <DetailItem label="Email">{user.email}</DetailItem>
        <DetailItem label={COLUMN_PHONE}>
          {user.phone === null ? NO_PHONE : formatPhone(user.phone)}
        </DetailItem>
        <DetailItem label={COLUMN_TYPE}>
          <Badge variant="outline">
            {ACCOUNT_TYPE_LABEL[user.accountType]}
          </Badge>
        </DetailItem>
        <DetailItem label={COLUMN_CREATED}>
          {formatDateTime(user.createdAt)}
        </DetailItem>
        <DetailItem label={COLUMN_STATUS}>
          <UserStatus user={user} />
        </DetailItem>
        {user.status === "locked" && (
          <DetailItem label={LOCK_REASON_LABEL}>
            {user.lockedReason ?? NO_LOCK_REASON}
          </DetailItem>
        )}
        {mine && <DetailItem label={COLUMN_USER}>{MY_ACCOUNT_NOTE}</DetailItem>}
      </DetailList>
    </RowDetail>
  );
}

/**
 * The buttons of one row (scope #20, spec 0023, AC-5), as `rowActions` decided them: an active
 * account has "Khóa" and "Thu hồi phiên", a locked one only "Mở khóa", and the viewer's own row has
 * neither. Every row also has "Xem chi tiết", next to the first button so a narrow column keeps
 * it on the first line. It holds the long text (the lock reason, and why the viewer's own row has
 * no lock button), so no small note sits on the row. Every name carries the
 * email of the row, so a screen reader that lists the buttons of the page can tell them apart.
 * `data-user-actions` is how a dialog finds a button of the same row to give focus back to when the
 * one that opened it is gone.
 */
export function UserRowActions({
  user,
  actions,
  size,
  onLock,
  onUnlock,
  onRevoke,
}: {
  user: AdminUserListItem;
  actions: RowActions;
  /** 32 px in the table, 44 px in the blocks. */
  size: "sm" | "lg";
  onLock: (user: AdminUserListItem) => void;
  onUnlock: (user: AdminUserListItem) => void;
  onRevoke: (user: AdminUserListItem) => void;
}) {
  return (
    <div
      data-user-actions={user.id}
      className="flex flex-wrap items-center gap-2"
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
      <UserDetail user={user} mine={actions.mine} size={size} />
      {actions.revoke && (
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={revokeButtonName(user.email)}
          onClick={() => onRevoke(user)}
        >
          <LogOutIcon data-icon="inline-start" aria-hidden="true" />
          {REVOKE_BUTTON}
        </Button>
      )}
    </div>
  );
}
