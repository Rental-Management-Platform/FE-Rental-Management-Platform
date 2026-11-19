import { Skeleton } from "@/components/ui/skeleton";
import { LOADING_TEXT } from "../landlord-stats-text";

const CARDS = [0, 1, 2, 3];

/**
 * The first load: one block for each part of the screen, each with a fixed minimum height, so the
 * number cards and the chart do not move the page when the answer arrives (spec 0024, AC-4). It
 * says why nothing is there yet in text only a screen reader reads.
 */
export function LandlordStatsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span role="status" className="sr-only">
        {LOADING_TEXT}
      </span>
      <Skeleton className="h-11 w-full max-w-md rounded-lg" />
      <Skeleton className="h-5 w-full max-w-xl" />
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => (
          <li key={card} className="min-w-0">
            <Skeleton className="h-36 w-full rounded-xl" />
          </li>
        ))}
      </ul>
      <Skeleton className="h-[26rem] w-full rounded-xl" />
    </div>
  );
}
