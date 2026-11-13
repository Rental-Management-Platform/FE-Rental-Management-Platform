import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PropertyListItem } from "@/lib/api/types";
import { formatCount, formatDateTime } from "@/lib/format";
import { PropertyRowActions } from "./property-row-actions";
import { UnpinnedBadge } from "./unpinned-badge";

interface PropertiesTableProps {
  rows: readonly PropertyListItem[];
  onDelete: (property: PropertyListItem) => void;
}

/**
 * The table of "Nhà trọ của tôi" from `md` up (spec 0019, AC-11, AC-19). It runs edge to edge in
 * its zone. `fullAddress` is joined by the backend, so it is shown as it came.
 */
export function PropertiesTable({ rows, onDelete }: PropertiesTableProps) {
  return (
    <Table>
      <TableCaption className="sr-only">Danh sách nhà trọ của bạn</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Nhà trọ</TableHead>
          <TableHead className="text-right">Số tin</TableHead>
          <TableHead>Ngày tạo</TableHead>
          <TableHead>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((property) => (
          <TableRow key={property.id}>
            <TableCell className="max-w-md">
              <div className="flex min-w-56 flex-col items-start gap-1">
                <span
                  className="max-w-full truncate font-medium"
                  title={property.name}
                >
                  {property.name}
                </span>
                <span
                  className="max-w-full truncate text-sm text-muted-foreground"
                  title={property.fullAddress}
                >
                  {property.fullAddress}
                </span>
                <UnpinnedBadge property={property} />
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(property.listingCount)}
            </TableCell>
            <TableCell>{formatDateTime(property.createdAt)}</TableCell>
            <TableCell>
              <PropertyRowActions
                property={property}
                size="sm"
                onDelete={onDelete}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
