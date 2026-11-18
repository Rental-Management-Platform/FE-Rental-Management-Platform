import type { ReactNode } from "react";
import type { ModerationListing, Uuid } from "@/lib/api/types";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  COLUMN_CREATED,
  COLUMN_LANDLORD,
  COLUMN_PRICE,
} from "../admin-listings-text";
import { LandlordCell } from "./landlord-cell";
import { ListingCell } from "./listing-cell";
import { ModerationStatus } from "./moderation-status";

/**
 * The list below `md` (scope #21): each listing is a block that stacks. The blocks sit inside the
 * zone and are told apart by a hairline, never by a card of their own, because a card never sits
 * inside another card. It shows the same values as the table.
 */
export function ModerationCards({
  rows,
  landlordHref,
  actions,
}: {
  rows: readonly ModerationListing[];
  /** The address of the list of one landlord's listings. */
  landlordHref: (landlordId: Uuid) => string;
  /** The buttons of one row. Left out, the blocks have none. */
  actions?: (listing: ModerationListing) => ReactNode;
}) {
  return (
    <ul className="flex flex-col">
      {rows.map((listing) => (
        <li
          key={listing.id}
          className="flex flex-col gap-3 border-t px-(--card-spacing) py-4"
        >
          <ListingCell listing={listing} />
          <ModerationStatus listing={listing} />
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{COLUMN_LANDLORD}</dt>
            <dd className="min-w-0">
              <LandlordCell
                name={listing.landlord.name}
                href={landlordHref(listing.landlord.id)}
              />
            </dd>
            <dt className="text-muted-foreground">{COLUMN_PRICE}</dt>
            <dd className="tabular-nums">{formatMoney(listing.price)}</dd>
            <dt className="text-muted-foreground">{COLUMN_CREATED}</dt>
            <dd>{formatDateTime(listing.createdAt)}</dd>
          </dl>
          {actions && <div className="empty:hidden">{actions(listing)}</div>}
        </li>
      ))}
    </ul>
  );
}
