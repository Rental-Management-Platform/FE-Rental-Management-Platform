"use client";

import { useCallback, useState } from "react";

/**
 * The one line a screen reader hears after an action (spec 0013, AC-17). The zone draws it in a
 * `role="status"` element that is always mounted, so text that arrives later is read out. It is
 * emptied before each action, so the same sentence twice in a row is still read twice. It never
 * carries the text of a comment.
 */
export function useAnnounce() {
  const [announcement, setAnnouncement] = useState("");
  const announce = useCallback((text: string) => setAnnouncement(text), []);
  const clear = useCallback(() => setAnnouncement(""), []);
  return { announcement, announce, clear };
}
