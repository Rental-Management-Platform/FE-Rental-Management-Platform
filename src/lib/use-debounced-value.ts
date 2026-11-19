"use client";

import { useEffect, useState } from "react";

/**
 * `value`, but only after it has stayed the same for `delayMs`. A search box reads the typed text
 * through this, so a list is asked for once the person stops typing and not on every key.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
