import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT_TYPE_LABEL } from "@/features/account/access";
import type { AdminUserListItem } from "@/lib/api/types";
import { formatDateTime, formatPhone } from "@/lib/format";
import {
  COLUMN_CREATED,
  COLUMN_PHONE,
  COLUMN_TYPE,
  NO_PHONE,
} from "../admin-users-text";
import { UserCell } from "./user-cell";
import { UserStatus } from "./user-status";

/**
 * The list below `md` (scope #20): each account is a block that stacks. The blocks sit inside the
 * zone and are told apart by a hairline, never by a card of their own, because a card never sits
 * inside another card. It shows the same values as the table.
 */
export function UserCards({
  rows,
  actions,
}: {
  rows: readonly AdminUserListItem[];
  /** The buttons of one row. Left out, the blocks have none. */
  actions?: (user: AdminUserListItem) => ReactNode;
}) {
  return (
    <ul className="flex flex-col">
      {rows.map((user) => (
        <li
          key={user.id}
          className="flex flex-col gap-3 border-t px-(--card-spacing) py-4"
        >
          <UserCell user={user} />
          <UserStatus user={user} />
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{COLUMN_PHONE}</dt>
            <dd className="tabular-nums">
              {user.phone === null ? NO_PHONE : formatPhone(user.phone)}
            </dd>
            <dt className="text-muted-foreground">{COLUMN_TYPE}</dt>
            <dd>
              <Badge variant="outline">
                {ACCOUNT_TYPE_LABEL[user.accountType]}
              </Badge>
            </dd>
            <dt className="text-muted-foreground">{COLUMN_CREATED}</dt>
            <dd>{formatDateTime(user.createdAt)}</dd>
          </dl>
          {actions && <div className="empty:hidden">{actions(user)}</div>}
        </li>
      ))}
    </ul>
  );
}
