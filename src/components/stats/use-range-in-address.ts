"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseRange,
  rangeHref,
  todayInVietnam,
  type DateRange,
} from "@/lib/date-range";

/**
 * The range of a statistics screen, kept in the address (spec 0024, AC-2, and spec 0025, AC-2). The
 * address holds `?from=&to=`; anything that breaks the contract, or no params, is the default 30
 * days, and the request then carries neither day (`range` is `null`). "Today" is read on each
 * render, never kept from mount, so a pair that was the default yesterday is not taken for it.
 *
 * `setRange` replaces the address and stays where the page is, so the screen reads again without
 * a jump. `useSearchParams` needs a `<Suspense>` boundary above the screen that calls this hook.
 */
export function useRangeInAddress() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const range = parseRange(
    searchParams.get("from"),
    searchParams.get("to"),
    todayInVietnam(new Date()),
  );
  const setRange = (next: DateRange | null) =>
    router.replace(rangeHref(pathname, next), { scroll: false });

  return { range, setRange };
}
