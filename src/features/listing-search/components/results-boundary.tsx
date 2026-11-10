"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { LoadingState } from "@/components/states/loading-state";
import { searchFromParams } from "../schemas/search-params";
import { listingsHref } from "../search-href";
import { AddressChangedContext } from "./results-heading";

/**
 * Brings the skeleton back on every new search, filter, order or page (spec 0009, AC-6, and spec
 * 0016, AC-15). The first visit is covered by the <Suspense> the page puts around this component
 * (`useSearchParams` needs one). After that, the inner boundary is keyed on the cleaned address of
 * the whole state: a new key is a new boundary, so the old results leave the screen and the
 * skeleton shows until the new ones arrive, instead of the old list staying under a new heading.
 *
 * It also tells the results heading whether the address has changed since the first load, so the
 * heading can take focus after a change in place and stay quiet on the first load. That is state
 * worked out while rendering (a change of key sets it), so the heading that mounts for the new
 * results already sees it.
 */
export function ResultsBoundary({ children }: { children: ReactNode }) {
  const key = listingsHref(searchFromParams(useSearchParams()));
  const [shownKey, setShownKey] = useState(key);
  const [addressChanged, setAddressChanged] = useState(false);
  if (key !== shownKey) {
    setShownKey(key);
    setAddressChanged(true);
  }

  return (
    <AddressChangedContext value={addressChanged}>
      <Suspense key={key} fallback={<LoadingState variant="cards" />}>
        {children}
      </Suspense>
    </AddressChangedContext>
  );
}
