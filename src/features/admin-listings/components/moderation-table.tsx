import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ModerationListing, Uuid } from "@/lib/api/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  COLUMN_ACTIONS,
  COLUMN_CREATED,
  COLUMN_LANDLORD,
  COLUMN_LISTING,
  COLUMN_PRICE,
  COLUMN_STATUS,
  TABLE_CAPTION,
} from "../admin-listings-text";
import { LandlordCell } from "./landlord-cell";
import { ListingCell } from "./listing-cell";
import { ModerationStatus } from "./moderation-status";

/**
 * The table of listings from `md` up (scope #21). It runs edge to edge in its zone. Every value is
 * the listing's own field, in the order the API gave: the front end sorts nothing.
 */
export function ModerationTable({
  rows,
  landlordHref,
  actions,
}: {
  rows: readonly ModerationListing[];
  /** The address of the list of one landlord's listings. */
  landlordHref: (landlordId: Uuid) => string;
  /** The buttons of one row. Left out, the table has no action column. */
  actions?: (listing: ModerationListing) => ReactNode;
}) {
  return (
    <Table>
      <TableCaption className="sr-only">{TABLE_CAPTION}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{COLUMN_LISTING}</TableHead>
          <TableHead>{COLUMN_LANDLORD}</TableHead>
          <TableHead>{COLUMN_PRICE}</TableHead>
          <TableHead>{COLUMN_CREATED}</TableHead>
          <TableHead>{COLUMN_STATUS}</TableHead>
          {actions && <TableHead>{COLUMN_ACTIONS}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((listing) => (
          <TableRow key={listing.id}>
            <TableCell className="max-w-80">
              <ListingCell listing={listing} />
            </TableCell>
            <TableCell className="max-w-48">
              <LandlordCell
                name={listing.landlord.name}
                href={landlordHref(listing.landlord.id)}
              />
            </TableCell>
            <TableCell className="tabular-nums">
              {formatMoney(listing.price)}
            </TableCell>
            <TableCell>{formatDateTime(listing.createdAt)}</TableCell>
            <TableCell>
              <ModerationStatus listing={listing} />
            </TableCell>
            {actions && <TableCell>{actions(listing)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
