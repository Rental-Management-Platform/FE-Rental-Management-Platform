"use client";

import { useCallback, useRef } from "react";

/**
 * Focus for a dialog or sheet that is opened from state (`open={...}`) and has no trigger of its
 * own: one dialog shared by every row of a table, or a menu opened by a button elsewhere.
 * Radix returns focus to the trigger when such a thing closes. With no trigger it also cancels its
 * own fallback, so focus drops to the page body and a keyboard or screen reader user loses their
 * place.
 *
 * Call `remember()` from the event that opens it (the focused control is the one the person
 * used), and pass `onCloseAutoFocus` to the content of the dialog or sheet. If that control is
 * gone by the time it closes (its row was deleted), focus goes to what `fallback` returns.
 */
export function useReturnFocus(
  fallback?: () => HTMLElement | null | undefined,
) {
  const opener = useRef<HTMLElement | null>(null);

  const remember = useCallback(() => {
    const active = document.activeElement;
    opener.current =
      active instanceof HTMLElement && active !== document.body ? active : null;
  }, []);

  const onCloseAutoFocus = useCallback(
    (event: Event) => {
      // Stops Radix from sending focus to a trigger that does not exist.
      event.preventDefault();
      const target = opener.current?.isConnected
        ? opener.current
        : fallback?.();
      opener.current = null;
      target?.focus();
    },
    [fallback],
  );

  return { remember, onCloseAutoFocus };
}
