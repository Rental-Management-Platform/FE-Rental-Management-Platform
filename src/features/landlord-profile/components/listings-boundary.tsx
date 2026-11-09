"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { LoadingState } from "@/components/states/loading-state";
import { parsePageParam } from "@/features/listing-search/schemas/search-params";

/**
 * Brings the skeleton back on every new page of the landlord's listings. The first visit is
 * covered by the <Suspense> the page puts around this component (`useSearchParams` needs one).
 * After that, the inner boundary is keyed on the cleaned page: a new key is a new boundary, so the
 * old cards leave the screen and the skeleton shows until the new ones arrive, instead of the old
 * list staying under a new page number. The same idea as the search results (spec 0009, AC-6).
 */
export function ListingsBoundary({ children }: { children: ReactNode }) {
  const page = parsePageParam(useSearchParams().get("page"));

  return (
    <Suspense key={page} fallback={<LoadingState variant="cards" />}>
      {children}
    </Suspense>
  );
}
