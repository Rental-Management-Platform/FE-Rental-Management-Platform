"use client";

import { useEffect, useState } from "react";
import { isApiError } from "@/lib/api/errors";

// What the last tick measured, and which error it measured it for.
interface Tick {
  error: unknown;
  secondsLeft: number;
}

/**
 * Seconds left to wait after a 429, counting down once a second, and 0 for anything else.
 * It is keyed on the identity of the error object, so a second 429 with the same number of
 * seconds is a new error and starts the count again. The clock is read only inside the
 * effect, never while rendering, so the page can still be prerendered.
 */
export function useCountdown(error: unknown): number {
  const total =
    isApiError(error) && error.status === 429 ? error.retryAfterSeconds : null;
  const [tick, setTick] = useState<Tick | null>(null);

  useEffect(() => {
    if (total === null) return;
    const endsAt = Date.now() + total * 1000;
    const timer = setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTick({ error, secondsLeft });
      if (secondsLeft === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [error, total]);

  if (total === null) return 0;
  // Until the first tick for this error, the whole wait is left.
  return tick !== null && tick.error === error ? tick.secondsLeft : total;
}
