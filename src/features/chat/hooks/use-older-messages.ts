"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { ChatMessage, Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { FIRST_PAGE_LIMIT, getMessages } from "../api/chat-api";
import { chatKeys } from "../api/chat-keys";
import { mergeMessages } from "../merge-messages";

/**
 * "Xem tin cũ hơn" (spec 0012, AC-11): reads the 30 messages before the oldest one on screen and
 * merges them in at the top.
 *
 * The messages that were at the top edge of the view must stay where they are, so the distance
 * from the bottom of the scroll area is kept before the merge and put back right after it, in a
 * layout effect (before the browser paints). This does not rely on `overflow-anchor`, which
 * Safari does not do reliably. While the older messages go in, `quiet` is true and the log region
 * turns its live announcements off, so a screen reader does not read thirty old messages aloud.
 *
 * It is a mutation and does not retry. It does not touch the poll: the poll merges with whatever
 * the cache holds at the end of its own read.
 */
export function useOlderMessages(
  id: Uuid,
  scrollRef: RefObject<HTMLDivElement | null>,
  /** The oldest `seq` on screen. It changing is what tells the effect the merge has landed. */
  firstSeq: number | undefined,
) {
  const api = useApi();
  const queryClient = useQueryClient();
  // Distance from the bottom of the scroll area, taken before the merge. `null` when idle.
  const kept = useRef<number | null>(null);
  const [quiet, setQuiet] = useState(false);

  const mutation = useMutation({
    mutationFn: (beforeSeq: number) =>
      getMessages(api, id, { beforeSeq }, FIRST_PAGE_LIMIT),
    onSuccess: (page) => {
      if (page.items.length === 0) return;
      const element = scrollRef.current;
      kept.current = element ? element.scrollHeight - element.scrollTop : null;
      setQuiet(true);
      queryClient.setQueryData<ChatMessage[]>(
        chatKeys.messages(id),
        (current) =>
          current === undefined
            ? undefined
            : mergeMessages(current, page.items),
      );
    },
  });

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (kept.current === null || !element) return;
    element.scrollTop = element.scrollHeight - kept.current;
    kept.current = null;
    // One frame later, so the insert is over before announcements come back.
    const frame = requestAnimationFrame(() => setQuiet(false));
    return () => cancelAnimationFrame(frame);
  }, [firstSeq, scrollRef]);

  return { mutation, quiet };
}
