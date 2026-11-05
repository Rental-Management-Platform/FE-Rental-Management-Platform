"use client";

import { useEffect } from "react";

// Lowercase words joined by dashes: the only shape of address this fix will write.
const SAFE_PATH = /^\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Corrects the address bar when it is not the canonical address of the listing (spec 0010,
 * AC-11): an old slug, a wrong slug, or only the code. It uses the native History API, which the
 * Next.js router follows, so there is no navigation, no request and no new history entry, and the
 * back button does not loop. The query string and the hash stay. Running it twice (React
 * StrictMode) changes nothing the second time. It draws nothing.
 */
export function ListingAddressFix({ path }: { path: string }) {
  useEffect(() => {
    if (!SAFE_PATH.test(path)) return;
    const { pathname, search, hash } = window.location;
    if (pathname === path) return;
    window.history.replaceState(null, "", `${path}${search}${hash}`);
  }, [path]);

  return null;
}
