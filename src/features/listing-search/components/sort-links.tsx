import Link from "next/link";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { LISTING_SORTS, type ListingSearch } from "../schemas/search-params";
import { listingsHref, withSort } from "../search-href";
import { SORT_LABELS } from "../text";

/**
 * The three orders of the list as real links (spec 0016, AC-13). Each keeps the keyword and the
 * filters and goes back to page 1, so it works without scripts. The chosen one is told by weight
 * and an underline as well as `aria-current`, never by color alone. Under `md` each link is 44 px
 * high.
 */
export function SortLinks({ search }: { search: ListingSearch }) {
  return (
    <nav aria-label="Sắp xếp">
      <ul className="-mx-2 flex flex-wrap items-center">
        {LISTING_SORTS.map((sort) => {
          const selected = search.sort === sort;
          return (
            <li key={sort}>
              <Link
                href={listingsHref(withSort(search, sort))}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  FOCUS_RING,
                  "inline-flex min-h-11 items-center rounded-md px-2 text-sm md:min-h-8",
                  selected
                    ? "font-semibold text-foreground underline underline-offset-4"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {SORT_LABELS[sort]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
