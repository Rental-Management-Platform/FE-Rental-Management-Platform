import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACCOUNT_TYPE_LABEL } from "@/features/account/access";
import type { AdminUserListItem } from "@/lib/api/types";
import { formatDateTime, formatPhone } from "@/lib/format";
import {
  COLUMN_CREATED,
  COLUMN_PHONE,
  COLUMN_STATUS,
  COLUMN_TYPE,
  COLUMN_USER,
  NO_PHONE,
  TABLE_CAPTION,
} from "../admin-users-text";
import { UserCell } from "./user-cell";
import { UserStatus } from "./user-status";

/**
 * The table of accounts from `md` up (scope #20). It runs edge to edge in its zone. Every value is
 * the account's own field, in the order the API gave: the front end sorts nothing.
 */
export function UsersTable({ rows }: { rows: readonly AdminUserListItem[] }) {
  return (
    <Table>
      <TableCaption className="sr-only">{TABLE_CAPTION}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{COLUMN_USER}</TableHead>
          <TableHead>{COLUMN_PHONE}</TableHead>
          <TableHead>{COLUMN_TYPE}</TableHead>
          <TableHead>{COLUMN_CREATED}</TableHead>
          <TableHead>{COLUMN_STATUS}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="max-w-72">
              <UserCell user={user} />
            </TableCell>
            <TableCell className="tabular-nums">
              {user.phone === null ? NO_PHONE : formatPhone(user.phone)}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {ACCOUNT_TYPE_LABEL[user.accountType]}
              </Badge>
            </TableCell>
            <TableCell>{formatDateTime(user.createdAt)}</TableCell>
            <TableCell>
              <UserStatus user={user} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
