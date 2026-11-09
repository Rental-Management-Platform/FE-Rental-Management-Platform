"use client";

import { useQuery } from "@tanstack/react-query";
import type { Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { messagesQuery } from "../api/chat-queries";
import { usePollRules } from "./use-poll-rules";

/** How often an open conversation asks for newer messages (spec 0012, AC-10). */
export const THREAD_POLL_MS = 4_000;

/**
 * The messages of one conversation, asked for again every few seconds under the rules of
 * `usePollRules`. `failing` is true after two asks in a row failed: the screen then says so in one
 * small line, and keeps every message it already shows.
 */
export function useThreadMessages(id: Uuid) {
  const api = useApi();
  const { track, options, failing } = usePollRules(THREAD_POLL_MS);
  const query = useQuery({ ...messagesQuery(api, id, track), ...options });
  return { query, failing };
}
