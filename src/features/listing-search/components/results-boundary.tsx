"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { LoadingState } from "@/components/states/loading-state";
import { parseListingSearch } from "../schemas/search-params";
import { listingsHref } from "../search-href";

/**
 * Brings the skeleton back on every new search or page (spec 0009, AC-6). The first visit is
 * covered by the <Suspense> the page puts around this component (`useSearchParams` needs one).
 * After that, the inner boundary is keyed on the cleaned address: a new key is a new boundary,
 * so the old results leave the screen and the skeleton shows until the new ones arrive, instead
 * of the old list staying under a new heading.
 */
export function ResultsBoundary({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const key = listingsHref(
    parseListingSearch({ q: params.get("q"), page: params.get("page") }),
  );

  return (
    <Suspense key={key} fallback={<LoadingState variant="cards" />}>
      {children}
    </Suspense>
  );
}
