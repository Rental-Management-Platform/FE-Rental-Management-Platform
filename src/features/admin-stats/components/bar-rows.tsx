import type { ReactNode } from "react";
import { StatBar } from "@/components/stats/stat-bar";
import { StatRow } from "@/components/stats/stat-row";
import { formatCount } from "@/lib/format";

export interface BarRow {
  label: string;
  /** The count of the row, a field of the answer. */
  count: number;
  /** A quiet line under the row. */
  note?: ReactNode;
}

/**
 * The rows of a state zone (spec 0025, AC-6, AC-7 and AC-8): each with its label, its count and a
 * thin bar against the largest count of the rows given. A zero is drawn in the muted colour, and a
 * bar has width 0 when the largest is 0. These are numbers of the moment, so no row has an arrow.
 * The bars only compare rows with each other: they are hidden from a screen reader, which reads
 * the number beside them.
 */
export function BarRows({ rows }: { rows: readonly BarRow[] }) {
  const largest = Math.max(0, ...rows.map((row) => row.count));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.label} className="flex flex-col gap-1.5">
          <StatRow
            label={row.label}
            value={formatCount(row.count)}
            note={row.note}
            muted={row.count === 0}
          />
          <StatBar value={row.count} largest={largest} />
        </li>
      ))}
    </ul>
  );
}
