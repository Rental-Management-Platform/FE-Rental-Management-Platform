import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { StatsZone } from "@/components/stats/stats-zone";
import type { AdminOverview } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ALL_CLEAR_TEXT,
  NONE_TEXT,
  TO_HANDLE_TITLE,
} from "../admin-stats-text";
import { toHandleRows, type ToHandleRow } from "../to-handle";
import type { SessionState } from "@/lib/session/create-session";

const ROW_CLASS =
  "flex min-h-11 items-center justify-between gap-3 py-2 text-sm md:min-h-0";

function RowBody({ row }: { row: ToHandleRow }) {
  const none = row.count === 0;
  return (
    <>
      <span className={cn(row.href !== null && "text-primary")}>
        {row.label}
      </span>
      <span className="flex items-center gap-1">
        <span
          className={cn(
            "text-base font-semibold tabular-nums",
            none ? "font-normal text-muted-foreground" : "text-card-foreground",
          )}
        >
          {none ? NONE_TEXT : formatCount(row.count)}
        </span>
        {row.href !== null && (
          <ChevronRightIcon
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
        )}
      </span>
    </>
  );
}

/**
 * The zone "Cần xử lý" (spec 0025, AC-5): what admins hid and may want to look at again, from
 * `toHandle`. A count above 0 is a link to the matching moderation list already filtered to hidden
 * by admin (only when the session holds that tool's permission), a 0 is a muted "Không có" with no
 * link, and when all three are 0 it says so. These are numbers of the moment: no arrow, no period
 * before, and they do not change with the range.
 */
export function ToHandleStrip({
  toHandle,
  session,
}: {
  toHandle: AdminOverview["toHandle"];
  session: SessionState;
}) {
  const rows = toHandleRows(toHandle, session);
  const allClear = rows.every((row) => row.count === 0);

  return (
    <StatsZone title={TO_HANDLE_TITLE}>
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.key} className="border-b last:border-b-0">
            {row.href !== null ? (
              <Link
                href={row.href}
                className={cn(
                  FOCUS_RING,
                  ROW_CLASS,
                  "rounded-sm underline-offset-4 hover:[&>span:first-child]:underline",
                )}
              >
                <RowBody row={row} />
              </Link>
            ) : (
              <div className={ROW_CLASS}>
                <RowBody row={row} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {allClear && (
        <p className="text-sm text-muted-foreground">{ALL_CLEAR_TEXT}</p>
      )}
    </StatsZone>
  );
}
