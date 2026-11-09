// The one way messages enter the cache of a conversation (spec 0012, AC-10 and AC-23). Polling,
// sending and "Xem tin cũ hơn" can run at the same time, so each of them merges what it got
// into what is there instead of replacing it.

import type { ChatMessage } from "@/lib/api/types";

/**
 * The union of two lists by `seq`, ascending, with no repeated `seq`. A message never changes
 * after it is sent, so for a repeated `seq` it does not matter which copy stays. Neither input
 * is changed.
 */
export function mergeMessages(
  current: readonly ChatMessage[],
  incoming: readonly ChatMessage[],
): ChatMessage[] {
  const bySeq = new Map(
    [...current, ...incoming].map((message) => [message.seq, message]),
  );
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq);
}
