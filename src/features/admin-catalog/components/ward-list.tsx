import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CatalogWard } from "@/lib/api/types";
import {
  COLUMN_ACTIONS,
  COLUMN_BOX,
  COLUMN_CODE,
  COLUMN_NAME,
  COLUMN_PROVINCE,
  HAS_BOX,
  NO_BOX,
  WARDS_CAPTION,
} from "../admin-catalog-text";
import { RowButtons } from "./row-buttons";

/** What the table and the blocks of the wards need to draw a row and to act on it. */
export interface WardListProps {
  rows: readonly CatalogWard[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (ward: CatalogWard) => void;
  onDelete: (ward: CatalogWard) => void;
}

/**
 * The table of the wards from `md` up (scope #23). It runs edge to edge in its zone. Every value is
 * the ward's own field, in the order the API gave (the letters of the Vietnamese alphabet): the
 * front end sorts nothing. "Hộp bản đồ" says whether the ward limits the pin of a property on the
 * map; only the migration and the seed write it, so a ward added here always reads "Chưa có".
 */
export function WardTable({
  rows,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: WardListProps) {
  return (
    <Table>
      <TableCaption className="sr-only">{WARDS_CAPTION}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{COLUMN_CODE}</TableHead>
          <TableHead>{COLUMN_NAME}</TableHead>
          <TableHead>{COLUMN_PROVINCE}</TableHead>
          <TableHead>{COLUMN_BOX}</TableHead>
          {(canUpdate || canDelete) && <TableHead>{COLUMN_ACTIONS}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((ward) => (
          <TableRow key={ward.code}>
            <TableCell className="font-medium tabular-nums">
              {ward.code}
            </TableCell>
            <TableCell className="max-w-72">
              <span className="block truncate font-medium" title={ward.name}>
                {ward.name}
              </span>
            </TableCell>
            <TableCell className="max-w-64">
              <span className="block truncate" title={ward.provinceName}>
                {ward.provinceName}
              </span>
            </TableCell>
            <TableCell>{ward.bounds === null ? NO_BOX : HAS_BOX}</TableCell>
            {(canUpdate || canDelete) && (
              <TableCell>
                <RowButtons
                  name={ward.name}
                  size="sm"
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onEdit={() => onEdit(ward)}
                  onDelete={() => onDelete(ward)}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * The wards below `md` (scope #23): each ward is a block that stacks, with 44 px buttons. The
 * blocks sit inside the zone and are told apart by a hairline, never by a card of their own,
 * because a card never sits inside another card. It shows the same values as the table.
 */
export function WardCards({
  rows,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: WardListProps) {
  return (
    <ul className="flex flex-col">
      {rows.map((ward) => (
        <li
          key={ward.code}
          className="flex flex-col gap-3 border-t px-(--card-spacing) py-4"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium break-words">{ward.name}</span>
            <span className="text-sm break-words text-muted-foreground">
              {ward.provinceName}
            </span>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            Mã {ward.code} · {COLUMN_BOX}:{" "}
            {ward.bounds === null ? NO_BOX : HAS_BOX}
          </p>
          {(canUpdate || canDelete) && (
            <RowButtons
              name={ward.name}
              size="lg"
              canUpdate={canUpdate}
              canDelete={canDelete}
              onEdit={() => onEdit(ward)}
              onDelete={() => onDelete(ward)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
