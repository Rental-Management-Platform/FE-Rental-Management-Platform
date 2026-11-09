"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseReviewPage } from "../schemas/review-page";

/** The name of the address parameter that holds the page of reviews. The listings use `page`. */
export const REVIEW_PAGE_PARAM = "reviewPage";

/**
 * How a page change writes the address (spec 0014, AC-14):
 * - `router` (the default): `router.replace`, which asks the server to render the route again. The
 *   landlord profile uses it, and its listings zone reads `page` on the server.
 * - `history`: the native `window.history.replaceState`, which keeps the other parameters and the
 *   hash and asks the server for nothing. The listing page uses it, because a server render of the
 *   page would read the listing again for a change only the browser cares about.
 */
export type ReviewPageNavigate = "router" | "history";

/**
 * The page of reviews, which lives in the address (spec 0013, AC-11): `reviewPage`, read by Zod
 * (a whole number from 1, anything else is 1). It is its own parameter, so the listings zone above
 * keeps its `page` and this zone never touches it.
 *
 * `setPage` writes the new page into the current address and keeps every other parameter (page 1
 * removes `reviewPage`, so the first page is the clean address). It replaces the entry and does not
 * scroll, so the back button does not walk through every page and the person stays where they are.
 * It reads `useSearchParams`, so the zone keeps it inside a `<Suspense>` boundary.
 */
export function useReviewPage(navigate: ReviewPageNavigate = "router") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parseReviewPage(searchParams.get(REVIEW_PAGE_PARAM));

  const setPage = (to: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (to <= 1) next.delete(REVIEW_PAGE_PARAM);
    else next.set(REVIEW_PAGE_PARAM, String(to));
    const query = next.toString();

    if (navigate === "history") {
      window.history.replaceState(
        null,
        "",
        pathname + (query === "" ? "" : `?${query}`) + window.location.hash,
      );
      return;
    }
    router.replace(query === "" ? pathname : `${pathname}?${query}`, {
      scroll: false,
    });
  };

  return { page, setPage };
}
