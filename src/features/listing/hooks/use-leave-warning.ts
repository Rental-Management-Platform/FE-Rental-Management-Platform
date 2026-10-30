"use client";

import { useEffect } from "react";

/**
 * While `when` is true, closing the tab or reloading shows the browser's own confirmation, so
 * typed text is not lost by accident (spec 0006, AC-10). The listener goes when `when` turns
 * false and when the component unmounts. A link click inside the site is not guarded: the App
 * Router has no hook for it, a known limit.
 */
export function useLeaveWarning(when: boolean) {
  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers (Chrome and Edge before 119) show the prompt only when this is set.
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [when]);
}
