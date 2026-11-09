"use client";

import { useCallback, useRef, useState } from "react";
import {
  nextPollDelay,
  rateLimitStillRunning,
  SHOWS_FAILURE_NOTICE_AT,
} from "../poll";

// The part of a TanStack query that the rules read.
type PolledQuery = { state: { error: unknown; errorUpdatedAt: number } };

/**
 * The rules of asking again for one polled query (spec 0012, AC-10): `options` goes into
 * `useQuery`, `track` goes to the query's read, and `failing` says when to show the small line.
 *
 * The number of failures in a row is kept here, in a ref that the read changes as soon as it
 * fails and the interval function reads when it decides how long to wait. TanStack's own failure
 * count starts again from 0 at every fetch, and a count that reached the interval function
 * through a render would arrive one step late.
 *
 * A hidden tab does not ask (`refetchIntervalInBackground` is off) and asks at once when shown,
 * unless the last answer was a 429 whose wait is still running.
 */
export function usePollRules(baseMs: number) {
  const failures = useRef(0);
  // The same number for the screen, because a ref that changes does not redraw anything.
  const [shown, setShown] = useState(0);

  const track = useCallback((failed: boolean) => {
    failures.current = failed ? failures.current + 1 : 0;
    setShown(failures.current);
  }, []);

  return {
    track,
    options: {
      refetchInterval: (query: PolledQuery) =>
        nextPollDelay({
          base: baseMs,
          error: query.state.error,
          failures: failures.current,
        }),
      refetchOnWindowFocus: (query: PolledQuery) =>
        !rateLimitStillRunning({
          error: query.state.error,
          errorUpdatedAt: query.state.errorUpdatedAt,
          now: Date.now(),
        }),
      refetchIntervalInBackground: false,
    },
    /** Two asks in a row failed. A lone failure, and a lone 429, say nothing. */
    failing: shown >= SHOWS_FAILURE_NOTICE_AT,
  };
}
