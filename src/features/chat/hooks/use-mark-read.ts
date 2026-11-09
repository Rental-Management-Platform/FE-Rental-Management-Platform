"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import type {
  ChatMessage,
  ConversationItem,
  Page,
  Uuid,
} from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { markRead } from "../api/chat-api";
import { chatKeys } from "../api/chat-keys";
import { initialReadThrough, markReadTarget } from "../mark-read";
import { usePageVisible } from "./use-page-visible";

interface MarkReadInput {
  id: Uuid;
  /** The head of the conversation: its `unreadCount` says whether anything was unread on open. */
  head: ConversationItem | undefined;
  /** The messages on screen, ascending. */
  messages: readonly ChatMessage[] | undefined;
  /** The list is within 80 px of its bottom (`useStickyBottom`). */
  atBottom: boolean;
}

/**
 * Marks the conversation as read when the person is really looking at its newest message (spec
 * 0012, AC-17): the tab is shown, the list is at the bottom, and a message from the other side is
 * newer than what is read. It looks again when the messages change, when the list reaches or
 * leaves the bottom, and when the tab is shown or hidden.
 *
 * Only one `read` request is out at a time. While one is out, the newest wanted `upToSeq` waits
 * and goes when the answer is in, so answers can never come back in the wrong order and an old
 * `unreadCount` can never overwrite a new one. The same `upToSeq` is never sent twice. A message
 * from the other side that arrives while the person reads older messages is not counted as read
 * until the list is back at the bottom.
 */
export function useMarkRead({ id, head, messages, atBottom }: MarkReadInput) {
  const api = useApi();
  const queryClient = useQueryClient();
  const visible = usePageVisible();

  // The highest `seq` asked to be read in this visit. `null` until the first messages are in.
  const readThrough = useRef<number | null>(null);
  const inFlight = useRef(false);
  // The newest `upToSeq` wanted while a request was out.
  const waiting = useRef<number | null>(null);

  const send = useCallback(
    async function run(upToSeq: number): Promise<void> {
      inFlight.current = true;
      const before = readThrough.current;
      readThrough.current = upToSeq;
      try {
        const conversation = await markRead(api, id, upToSeq);
        // Reading does not change the order of the inbox, so the row is edited in place.
        queryClient.setQueryData<ConversationItem>(
          chatKeys.conversation(id),
          conversation,
        );
        queryClient.setQueriesData<Page<ConversationItem>>(
          { queryKey: chatKeys.inboxAll() },
          (page) =>
            page && {
              ...page,
              items: page.items.map((row) =>
                row.id === conversation.id ? conversation : row,
              ),
            },
        );
        // The count in the page header moves now, not at its next poll.
        void queryClient.invalidateQueries({ queryKey: chatKeys.unread() });
      } catch {
        // The mark did not arrive. Forget that it was asked, so the next change of what is on
        // screen tries again.
        if (readThrough.current === upToSeq) readThrough.current = before;
      } finally {
        inFlight.current = false;
        const next = waiting.current;
        waiting.current = null;
        if (next !== null && next > (readThrough.current ?? 0)) void run(next);
      }
    },
    [api, id, queryClient],
  );

  useEffect(() => {
    if (head === undefined || messages === undefined || messages.length === 0) {
      return;
    }
    readThrough.current ??= initialReadThrough(head.unreadCount, messages);
    if (!visible || !atBottom) return;

    const target = markReadTarget(messages, readThrough.current);
    if (target === null || target <= readThrough.current) return;
    if (inFlight.current) {
      waiting.current = target;
      return;
    }
    void send(target);
  }, [head, messages, atBottom, visible, send]);
}
