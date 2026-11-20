"use client";

import { useId, useState } from "react";
import { StatBar } from "@/components/stats/stat-bar";
import { StatsZone } from "@/components/stats/stats-zone";
import { Button } from "@/components/ui/button";
import type { AdminOverview } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import {
  WARDS_COUNT_HEADER,
  WARDS_EMPTY_TEXT,
  WARDS_OPEN_LABEL,
  WARDS_TABLE_LABEL,
  WARDS_WARD_HEADER,
  WARDS_ZONE_TITLE,
  moreWardsLine,
  wardsTableCaption,
} from "../admin-stats-text";
import { largestCount, splitWards } from "../ward-rows";

const HEAD_CELL =
  "sticky top-0 h-10 border-b bg-muted px-3 font-medium whitespace-nowrap text-foreground";

/**
 * The zone "Tin mới theo phường" (spec 0025, AC-12): the first ten wards where listings of the
 * range were posted, in the order the API gave, each with its rank, its count and a bar against
 * the largest shown. With more rows it says how many are left and a button opens a table of every
 * row under the top ten. No total of the rows is shown: the total is the "Tin mới" card. The open
 * table is kept while the range changes and reset when the zone mounts again.
 */
export function WardsZone({ overview }: { overview: AdminOverview }) {
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();
  const rows = overview.listings.createdByWard;
  const { shown, rest } = splitWards(rows);
  const largest = largestCount(shown);

  return (
    <StatsZone title={WARDS_ZONE_TITLE}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{WARDS_EMPTY_TEXT}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {shown.map((ward, index) => (
            <li
              key={ward.wardCode}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1"
            >
              {/* The rank is the place in the list, so tied counts still have different ranks. */}
              <span className="text-sm text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 text-sm text-card-foreground">
                {ward.wardName}
              </span>
              <span className="text-base font-semibold text-card-foreground tabular-nums">
                {formatCount(ward.count)}
              </span>
              <StatBar
                value={ward.count}
                largest={largest}
                className="col-start-2 col-end-4"
              />
            </li>
          ))}
        </ol>
      )}
      {rest > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm text-muted-foreground">
              {moreWardsLine(rest)}
            </p>
            <Button
              type="button"
              variant="outline"
              className="max-md:h-11"
              aria-expanded={tableOpen}
              aria-controls={tableId}
              onClick={() => setTableOpen((open) => !open)}
            >
              {WARDS_OPEN_LABEL}
            </Button>
          </div>
          <div id={tableId}>
            {tableOpen && (
              <div
                role="region"
                aria-label={WARDS_TABLE_LABEL}
                tabIndex={0}
                className="max-h-80 overflow-auto rounded-lg border outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <table className="w-full caption-top text-sm">
                  <caption className="sr-only">
                    {wardsTableCaption(overview.period)}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className={`${HEAD_CELL} text-left`}>
                        {WARDS_WARD_HEADER}
                      </th>
                      <th scope="col" className={`${HEAD_CELL} text-right`}>
                        {WARDS_COUNT_HEADER}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((ward) => (
                      <tr
                        key={ward.wardCode}
                        className="border-b last:border-0"
                      >
                        <th
                          scope="row"
                          className="px-3 py-2 text-left font-normal"
                        >
                          {ward.wardName}
                        </th>
                        <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">
                          {formatCount(ward.count)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </StatsZone>
  );
}
