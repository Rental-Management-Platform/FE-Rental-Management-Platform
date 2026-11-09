"use client";

import { useEffect, useState } from "react";

/** How often the clock is read again while a page stays open. */
const REFRESH_MS = 60_000;

/**
 * The current date and time, kept in state. A label such as "Hôm nay" is worked out from it, so it
 * changes by itself when midnight passes: it is read again every minute and as soon as a hidden
 * tab is shown again. A component never reads `Date.now()` while rendering, because then the same
 * props would draw different text from one render to the next.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, REFRESH_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return now;
}
