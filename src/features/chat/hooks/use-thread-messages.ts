"use client";

import { useQuery } from "@tanstack/react-query";
import type { Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { messagesQuery } from "../api/chat-queries";

/** How often an open conversation asks for newer messages (spec 0012, AC-10). */
export const THREAD_POLL_MS = 4_000;

/**
 * The messages of one conversation, asked for again every few seconds. A hidden tab does not ask
 * (`refetchIntervalInBackground` is off by default) and asks at once when it is shown again.
 */
export function useThreadMessages(id: Uuid) {
  const api = useApi();
  return useQuery({
    ...messagesQuery(api, id),
    refetchInterval: THREAD_POLL_MS,
  });
}
