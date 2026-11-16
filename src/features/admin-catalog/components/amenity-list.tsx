import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Amenity } from "@/lib/api/types";
import {
  AMENITIES_CAPTION,
  COLUMN_ACTIONS,
  COLUMN_KEY,
  COLUMN_NAME,
} from "../admin-catalog-text";
import { RowButtons } from "./row-buttons";

/** What the table and the blocks of the amenities need to draw a row and to act on it. */
export interface AmenityListProps {
  rows: readonly Amenity[];
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (amenity: Amenity) => void;
  onDelete: (amenity: Amenity) => void;
}

/**
 * The table of the amenities from `md` up (scope #23). It runs edge to edge in its zone. Every value
 * is the amenity's own field, in the order the API gave (by name): the front end sorts nothing.
 */
export function AmenityTable({
  rows,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: AmenityListProps) {
  return (
    <Table>
      <TableCaption className="sr-only">{AMENITIES_CAPTION}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{COLUMN_NAME}</TableHead>
          <TableHead>{COLUMN_KEY}</TableHead>
          {(canUpdate || canDelete) && <TableHead>{COLUMN_ACTIONS}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((amenity) => (
          <TableRow key={amenity.key}>
            <TableCell className="max-w-72">
              <span className="block truncate font-medium" title={amenity.name}>
                {amenity.name}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {amenity.key}
            </TableCell>
            {(canUpdate || canDelete) && (
              <TableCell>
                <RowButtons
                  name={amenity.name}
                  size="sm"
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onEdit={() => onEdit(amenity)}
                  onDelete={() => onDelete(amenity)}
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
 * The amenities below `md` (scope #23): each is a block that stacks, with 44 px buttons, told apart
 * by a hairline and not by a card of its own. It shows the same values as the table.
 */
export function AmenityCards({
  rows,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: AmenityListProps) {
  return (
    <ul className="flex flex-col">
      {rows.map((amenity) => (
        <li
          key={amenity.key}
          className="flex flex-col gap-3 border-t px-(--card-spacing) py-4"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium break-words">{amenity.name}</span>
            <span className="text-sm break-words text-muted-foreground">
              {COLUMN_KEY}: {amenity.key}
            </span>
          </div>
          {(canUpdate || canDelete) && (
            <RowButtons
              name={amenity.name}
              size="lg"
              canUpdate={canUpdate}
              canDelete={canDelete}
              onEdit={() => onEdit(amenity)}
              onDelete={() => onDelete(amenity)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
