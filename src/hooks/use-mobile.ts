import { useSyncExternalStore } from "react";

// Matches the `lg` breakpoint: below it the side menu becomes a sheet (spec 0003, "Shells").
const MOBILE_BREAKPOINT = 1024;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

// The server and the first client render say "not mobile", so the markup matches; CSS (`lg:`
// classes) already hides the desktop menu below the breakpoint until this catches up.
export function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
