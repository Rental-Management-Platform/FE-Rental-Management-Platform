import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChangeNoteView } from "./change-note";
import type { ChangeNote } from "./describe-change";

interface StatRowProps {
  /** What the number counts. */
  label: string;
  /** The number or sentence, already formatted. */
  value: ReactNode;
  /** How it changed against the period before; leave out for a number of the current state. */
  change?: ChangeNote | null;
  /** A quiet line under the row. */
  note?: ReactNode;
  /** A zero is drawn in the muted colour, so a row with nothing in it does not shout. */
  muted?: boolean;
  className?: string;
}

/**
 * One line of a zone: a label on the left, the value and its change note on the right, and an
 * optional quiet line under it (spec 0024). It holds no card, so it can sit in a `StatsZone`.
 */
export function StatRow({
  label,
  value,
  change = null,
  note,
  muted = false,
  className,
}: StatRowProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="flex flex-wrap items-baseline justify-end gap-x-2">
          <span
            className={cn(
              "text-base font-semibold tabular-nums",
              muted ? "text-muted-foreground" : "text-card-foreground",
            )}
          >
            {value}
          </span>
          {change !== null && <ChangeNoteView note={change} />}
        </p>
      </div>
      {note !== undefined && (
        <p className="text-sm text-muted-foreground">{note}</p>
      )}
    </div>
  );
}
