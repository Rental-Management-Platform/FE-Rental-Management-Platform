import Link from "next/link";
import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OwnerListingSummary } from "@/lib/api/types";
import {
  formatArea,
  formatCount,
  formatDateTime,
  formatMoney,
} from "@/lib/format";
import { FOCUS_RING } from "@/lib/focus-ring";
import { editListingHref } from "../listing-filter";
import type { RowUi } from "../row-ui";
import { ListingCover } from "./listing-cover";
import { RowActions } from "./row-actions";
import { RowNoticeView } from "./row-notice";
import { RowStatus } from "./row-status";

interface ListingsTableProps {
  rows: readonly OwnerListingSummary[];
  rowOf: (id: string) => RowUi;
  onToggle: (listing: OwnerListingSummary) => void;
}

const COLUMNS = 6;

/**
 * The table of "Tin của tôi" from `md` up (spec 0019, AC-19). It runs edge to edge in its zone.
 * The line about a row's last write is a row of its own under it, so a long message never
 * stretches a cell.
 */
export function ListingsTable({ rows, rowOf, onToggle }: ListingsTableProps) {
  return (
    <Table>
      <TableCaption className="sr-only">Danh sách tin của bạn</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Tin</TableHead>
          <TableHead className="text-right">Giá thuê</TableHead>
          <TableHead className="text-right">Lượt xem</TableHead>
          <TableHead>Ngày đăng</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((listing) => {
          const ui = rowOf(listing.id);
          return (
            <Fragment key={listing.id}>
              <TableRow className={ui.notice ? "border-b-0" : undefined}>
                <TableCell className="max-w-sm">
                  <div className="flex min-w-64 items-center gap-3">
                    <ListingCover listing={listing} className="w-16" />
                    <div className="flex min-w-0 flex-col">
                      <Link
                        href={editListingHref(listing.id)}
                        title={listing.title}
                        className={`${FOCUS_RING} truncate rounded-sm font-medium hover:underline`}
                      >
                        {listing.title}
                      </Link>
                      <span
                        className="truncate text-sm text-muted-foreground"
                        title={listing.fullAddress}
                      >
                        {listing.fullAddress}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span className="block font-semibold">
                    {formatMoney(listing.price)}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {formatArea(listing.areaM2)}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCount(listing.viewCount)}
                </TableCell>
                <TableCell>{formatDateTime(listing.createdAt)}</TableCell>
                <TableCell>
                  <RowStatus listing={listing} />
                </TableCell>
                <TableCell>
                  <RowActions
                    listing={listing}
                    ui={ui}
                    size="sm"
                    onToggle={onToggle}
                  />
                </TableCell>
              </TableRow>
              {ui.notice && (
                <TableRow>
                  <TableCell colSpan={COLUMNS} className="pt-0">
                    <RowNoticeView notice={ui.notice} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
