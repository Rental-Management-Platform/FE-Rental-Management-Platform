import { LOADING_TEXT } from "@/components/stats/stats-text";
import { Skeleton } from "@/components/ui/skeleton";

const STATE_ZONES = [0, 1, 2];
const CARDS = [0, 1, 2, 3];

/**
 * The part above the range bar while no answer has ever been kept: the strip and the three state
 * zones, each block with a fixed minimum height so nothing moves when the answer arrives (spec
 * 0025, AC-4). It has no text of its own: the one status line is in the part below the bar.
 */
export function AboveBarSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-52 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {STATE_ZONES.map((zone) => (
          <Skeleton key={zone} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * The first load of everything under the range bar: one block per part, each with a fixed minimum
 * height, with the words only a screen reader reads (spec 0025, AC-4).
 */
export function BelowBarSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span role="status" className="sr-only">
        {LOADING_TEXT}
      </span>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => (
          <li key={card} className="min-w-0">
            <Skeleton className="h-32 w-full rounded-xl" />
          </li>
        ))}
      </ul>
      <Skeleton className="h-[26rem] w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

/** The skeleton of the route, before the screen is loaded: both parts and the height of the bar. */
export function AdminStatsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <AboveBarSkeleton />
      <Skeleton className="h-11 w-full max-w-md rounded-lg" />
      <BelowBarSkeleton />
    </div>
  );
}
