import { LOADING_TEXT } from "@/components/stats/stats-text";
import { Skeleton } from "@/components/ui/skeleton";

// The two groups of number cards: four registration numbers, then seven interest numbers. The
// second group has a quiet line under its heading, so its heading block is taller.
const CARD_GROUPS = [
  { cards: [0, 1, 2, 3], note: false },
  { cards: [0, 1, 2, 3, 4, 5, 6], note: true },
];

// The heights are those of the drawn blocks (measured from 320 to 1280 px), so the page does not
// grow or shrink when the answer arrives. The state zones share a row from `lg`, where a row is as
// tall as its tallest zone. Each class is written whole, because Tailwind reads class names from
// the source and cannot find one that is joined from pieces.
const ACCOUNTS_HEIGHT = "h-[24.75rem]";
const LANDLORDS_HEIGHT = "h-[17.25rem] lg:h-[24.75rem]";
const LISTINGS_HEIGHT = "h-[23.25rem] xl:h-[24.75rem]";

/**
 * The part above the range bar while no answer has ever been kept: the strip and the three state
 * zones, each block with a fixed minimum height so nothing moves when the answer arrives (spec
 * 0025, AC-4). It has no text of its own: the one status line is in the part below the bar.
 */
export function AboveBarSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-56 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Skeleton className={`${ACCOUNTS_HEIGHT} w-full rounded-xl`} />
        <Skeleton className={`${LANDLORDS_HEIGHT} w-full rounded-xl`} />
        <Skeleton className={`${LISTINGS_HEIGHT} w-full rounded-xl`} />
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
      {CARD_GROUPS.map(({ cards, note }, group) => (
        <div key={group} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-44 rounded-md" />
            {note && <Skeleton className="h-5 w-full max-w-md rounded-md" />}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <li key={card} className="min-w-0">
                <Skeleton className="h-[9.25rem] w-full rounded-xl" />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Skeleton className="h-[31.75rem] w-full rounded-xl" />
      <Skeleton className="h-[40rem] w-full rounded-xl" />
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
