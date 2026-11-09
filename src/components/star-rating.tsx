import { StarIcon } from "lucide-react";
import { formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

const STARS = [0, 1, 2, 3, 4];
const MAX = STARS.length;

// A row of five stars with no gap, so a width in percent lands exactly on a star edge.
function StarRow({ className }: { className?: string }) {
  return (
    <span className={cn("flex", className)}>
      {STARS.map((i) => (
        <StarIcon
          key={i}
          aria-hidden="true"
          className="size-4 shrink-0 fill-current"
        />
      ))}
    </span>
  );
}

type StarRatingProps = {
  /** From 0 to 5. A whole number for one review, or an average such as 4.3. Out of range is clamped. */
  value: number;
  className?: string;
};

/**
 * Stars for a score, display only (spec 0013, AC-17). The five empty stars sit underneath and the
 * filled ones are clipped on top to `value / 5` of the width, so 4.3 fills four stars and a bit of
 * the fifth. The icons are hidden from a screen reader and the whole row is one image labelled
 * "4 trên 5 sao". Filled stars are `text-primary` and empty ones `text-muted-foreground`, two
 * pairs `scripts/check-contrast.mjs` already measures.
 */
export function StarRating({ value, className }: StarRatingProps) {
  const score = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), MAX);
  const spoken = Number.isInteger(score) ? String(score) : formatRating(score);

  return (
    <span
      role="img"
      aria-label={`${spoken} trên ${MAX} sao`}
      className={cn("relative inline-flex shrink-0", className)}
    >
      <StarRow className="text-muted-foreground" />
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 overflow-hidden text-primary"
        style={{ width: `${(score / MAX) * 100}%` }}
      >
        <StarRow />
      </span>
    </span>
  );
}
