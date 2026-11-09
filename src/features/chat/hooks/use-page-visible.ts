"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};

/**
 * True while the tab is shown. A message is marked as read only then, because a conversation in
 * a hidden tab has not been read by anyone (spec 0012, AC-17). The server snapshot is `true`:
 * this decides what to do, never what to draw.
 */
export const usePageVisible = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => document.visibilityState === "visible",
    () => true,
  );
