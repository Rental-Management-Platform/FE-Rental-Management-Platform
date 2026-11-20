import { LOADING_TEXT } from "@/components/stats/stats-text";
import { Skeleton } from "@/components/ui/skeleton";

// The heights are those of the drawn blocks (measured from 320 to 1280 px), so the page does not
// grow or shrink when the answer arrives. The totals block is as tall as its date note is long:
// three lines on a phone, two on a tablet, one from `xl`, where the cards are side by side. The
// chart zone has 44 px buttons below `md`, and its title takes two lines at 345 px and below. Each
// class is written whole, because Tailwind reads class names from the source and cannot find one
// that is joined from pieces.
const TOTALS_HEIGHT = "h-[19.75rem] sm:h-[11.625rem] xl:h-[10.375rem]";
const CHART_HEIGHT =
  "h-[26.9375rem] max-[345px]:h-[28.4375rem] md:h-[26.6875rem]";

/**
 * The first load of everything under the range bar: one block per part, each with a fixed minimum
 * height, with the words only a screen reader reads (spec 0026, AC-4).
 */
export function RevenueSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span role="status" className="sr-only">
        {LOADING_TEXT}
      </span>
      <Skeleton className={`${TOTALS_HEIGHT} w-full rounded-xl`} />
      <Skeleton className={`${CHART_HEIGHT} w-full rounded-xl`} />
    </div>
  );
}

/** The skeleton of the route, before the screen is loaded: the height of the bar, then the blocks. */
export function RevenueScreenSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-11 w-full max-w-md rounded-lg" />
      <RevenueSkeleton />
    </div>
  );
}
