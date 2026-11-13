import Link from "next/link";
import type { OwnerListingSummary } from "@/lib/api/types";
import {
  formatArea,
  formatCount,
  formatDateTime,
  formatMoney,
} from "@/lib/format";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { editListingHref } from "../listing-filter";
import type { RowUi } from "../row-ui";
import { ListingCover } from "./listing-cover";
import { RowActions } from "./row-actions";
import { RowNoticeView } from "./row-notice";
import { RowStatus } from "./row-status";

interface ListingRowCardsProps {
  rows: readonly OwnerListingSummary[];
  rowOf: (id: string) => RowUi;
  onToggle: (listing: OwnerListingSummary) => void;
  onDelete: (listing: OwnerListingSummary) => void;
}

/**
 * The list of "Tin của tôi" below `md` (spec 0019, AC-19): each listing is a block that stacks,
 * with 44 px buttons. The blocks sit inside the zone and are told apart by a hairline, never by a
 * card of their own, because a card never sits inside another card. It shares every part of the
 * row with the table, so the two cannot disagree.
 */
export function ListingRowCards({
  rows,
  rowOf,
  onToggle,
  onDelete,
}: ListingRowCardsProps) {
  return (
    <ul className="flex flex-col">
      {rows.map((listing) => {
        const ui = rowOf(listing.id);
        return (
          <li
            key={listing.id}
            className="flex flex-col gap-3 border-t px-(--card-spacing) py-4"
          >
            <div className="flex gap-3">
              <ListingCover listing={listing} className="w-24" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={editListingHref(listing.id)}
                  className={cn(
                    FOCUS_RING,
                    "line-clamp-2 rounded-sm font-medium",
                  )}
                >
                  {listing.title}
                </Link>
                <span className="line-clamp-2 text-sm text-muted-foreground">
                  {listing.fullAddress}
                </span>
                <span className="text-sm tabular-nums">
                  <span className="font-semibold">
                    {formatMoney(listing.price)}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatArea(listing.areaM2)}
                  </span>
                </span>
              </div>
            </div>
            <RowStatus listing={listing} />
            <p className="text-sm text-muted-foreground">
              {formatCount(listing.viewCount)} lượt xem · Đăng{" "}
              {formatDateTime(listing.createdAt)}
            </p>
            <RowActions
              listing={listing}
              ui={ui}
              size="lg"
              onToggle={onToggle}
              onDelete={onDelete}
            />
            {ui.notice && <RowNoticeView notice={ui.notice} />}
          </li>
        );
      })}
    </ul>
  );
}
