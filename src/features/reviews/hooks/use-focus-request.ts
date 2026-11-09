"use client";

import { useCallback, useRef } from "react";

/**
 * Moves focus to an element that may not exist yet (spec 0013, AC-8, AC-9 and AC-10). After a
 * write the pinned row, or the "Sửa" button inside it, appears on the next render, so focus cannot
 * be given in the handler that caused it. `request()` says focus is wanted, and `ref` goes on the
 * target: the moment the target mounts (or at once, if it is there), it takes focus and the
 * request is spent. `cancel()` drops a request that was never used, such as after a failed write.
 *
 * It is a callback ref and not an effect, so there is no state set in an effect and nothing runs
 * when no focus was asked for.
 */
export function useFocusRequest<T extends HTMLElement>() {
  const node = useRef<T | null>(null);
  const wanted = useRef(false);

  const ref = useCallback((element: T | null) => {
    node.current = element;
    if (element !== null && wanted.current) {
      wanted.current = false;
      element.focus();
    }
  }, []);

  const request = useCallback(() => {
    if (node.current !== null) {
      node.current.focus();
      return;
    }
    wanted.current = true;
  }, []);

  const cancel = useCallback(() => {
    wanted.current = false;
  }, []);

  return { ref, request, cancel };
}
