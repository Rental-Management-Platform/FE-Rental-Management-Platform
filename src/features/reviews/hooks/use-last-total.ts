"use client";

import { useState } from "react";

/**
 * The `total` of the list, and when this read has none, the last one that came back. A page that
 * fails to load has no answer, but the pagination must stay (spec 0013, AC-13), and it is built
 * from `total`. It is `null` until a first answer has come. It is the same number the list gave,
 * never another source.
 *
 * The remembered value is state set during the render that sees a new total, which is the way React
 * documents for state that follows a prop: it is not copied into an effect.
 */
export function useLastTotal(total: number | undefined): number | null {
  const [last, setLast] = useState<number | null>(null);
  if (total !== undefined && total !== last) setLast(total);
  return total ?? last;
}
