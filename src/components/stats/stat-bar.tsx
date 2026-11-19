import { cn } from "@/lib/utils";

/**
 * A thin bar whose length compares one count with the largest count shown beside it (spec 0024,
 * AC-10 and AC-11). It is only a width: hidden from a screen reader, which reads the number
 * next to it, and never the only carrier of a value. A largest of 0 draws an empty track.
 */
export function StatBar({
  value,
  largest,
  className,
}: {
  value: number;
  /** The largest count of the rows this bar belongs to. */
  largest: number;
  className?: string;
}) {
  const percent = largest > 0 ? Math.min(100, (value / largest) * 100) : 0;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block h-2 overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <span
        className="block h-full rounded-full bg-primary"
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}
