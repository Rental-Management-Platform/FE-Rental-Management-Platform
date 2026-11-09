// What marking a conversation as read means (spec 0012, AC-17), kept apart from React so the rule
// can be read on its own. `readThrough` is the highest `seq` known to be read.

import type { ChatMessage } from "@/lib/api/types";

/**
 * Where "read" starts when a conversation opens. With nothing unread, everything on screen is
 * already read, so opening it must not call `read` at all. With something unread, nothing on
 * screen is known to be read yet, so the first mark covers it.
 */
export const initialReadThrough = (
  unreadCount: number,
  messages: readonly ChatMessage[],
): number => (unreadCount > 0 ? 0 : (messages.at(-1)?.seq ?? 0));

/**
 * The `upToSeq` to send, or `null` when nothing needs marking: there must be a message from the
 * other side newer than what is read. My own messages never count as unread, and sending one moves
 * my read mark to it, so it also counts as read through its `seq`. The target is the last message
 * on screen, which is what the person is looking at when the list is at the bottom.
 */
export function markReadTarget(
  messages: readonly ChatMessage[],
  readThrough: number,
): number | null {
  const last = messages.at(-1);
  if (last === undefined) return null;
  const lastMine = messages.findLast((message) => message.isMine)?.seq ?? 0;
  const through = Math.max(readThrough, lastMine);
  return messages.some((message) => !message.isMine && message.seq > through)
    ? last.seq
    : null;
}
