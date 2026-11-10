"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
} from "react";
import { cn } from "@/lib/utils";

/**
 * `true` once the address has changed since the page first loaded, which the boundary around the
 * results works out (see `ResultsBoundary`). `false` on a first load and on a reload.
 */
export const AddressChangedContext = createContext(false);

/**
 * The `h2` of the results area (spec 0016, AC-15). When the results are drawn again for another
 * address (a filter, a clear button, a sort link, a page link, the back button) the link that was
 * clicked is gone, because the keyed boundary replaced the old list, and focus would fall back to
 * the page. So the new heading takes focus, and a screen reader starts at the new results. On a
 * first load or a reload the address has not changed, so it does nothing. `tabIndex={-1}` makes
 * it a focus target and not a control.
 */
export function ResultsHeading({
  className,
  ...props
}: Omit<ComponentProps<"h2">, "ref" | "tabIndex">) {
  const ref = useRef<HTMLHeadingElement>(null);
  const addressChanged = useContext(AddressChangedContext);

  useEffect(() => {
    if (addressChanged) ref.current?.focus();
  }, [addressChanged]);

  return (
    <h2
      ref={ref}
      tabIndex={-1}
      className={cn("outline-none", className)}
      {...props}
    />
  );
}
