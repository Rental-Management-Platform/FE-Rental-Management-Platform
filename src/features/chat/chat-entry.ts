// What the "Nhắn cho chủ trọ" button of a listing page is (spec 0012, AC-3), as one value, so the
// button is easy to draw and to preview. Pure: the session and the lookup come in as arguments.

import type { ConversationItem, Uuid } from "@/lib/api/types";
import { can } from "@/lib/session/can";
import type { SessionState } from "@/lib/session/create-session";

export type ChatEntry =
  /** The session is loading, or the look for an old conversation is pending: one skeleton. */
  | { kind: "checking" }
  /** A guest: a link to sign in, which comes back to the listing. */
  | { kind: "guest" }
  /** Nothing is drawn: the landlord of the listing, an admin, or no permission to chat. */
  | { kind: "none" }
  /** A conversation about this listing exists: a link to it. */
  | { kind: "existing"; conversationId: Uuid }
  /** None yet: the button opens the dialog for the first message. */
  | { kind: "new" };

/** The part of the by listing query the button reads. */
export type ChatLookup = {
  isPending: boolean;
  /** The conversation, `null` when there is none, `undefined` while pending or after an error. */
  data: ConversationItem | null | undefined;
};

/**
 * True for a signed in person who may open a conversation on a listing of this landlord: not the
 * landlord, not an admin (all seven chat calls answer an admin 403), and with both permissions.
 * `conversation:read` is needed as well as `conversation:create` because a sent message leads to
 * the conversation page, which reads. With only one of the two, the button would send the
 * message and then show a 403.
 */
export const mayChatAbout = (
  session: SessionState,
  landlordId: Uuid,
): boolean =>
  session.status === "user" &&
  session.user.accountType !== "admin" &&
  session.user.id !== landlordId &&
  can(session, "conversation:create") &&
  can(session, "conversation:read");

/**
 * The rule of AC-3, in this order:
 * 1. The session is `loading`: checking, so the button does not flash.
 * 2. A guest: the sign in link.
 * 3. Anyone who may not chat about this listing: nothing.
 * 4. Everyone else looks for a conversation they already have. Pending is checking. One found is
 *    `existing`. None found, or a failed look, is `new`: the button still works, and the server
 *    answers if a conversation was there after all.
 */
export function toChatEntry(
  session: SessionState,
  listing: { landlord: { id: Uuid } },
  lookup: ChatLookup,
): ChatEntry {
  if (session.status === "loading") return { kind: "checking" };
  if (session.status === "guest") return { kind: "guest" };
  if (!mayChatAbout(session, listing.landlord.id)) return { kind: "none" };

  if (lookup.isPending) return { kind: "checking" };
  return lookup.data
    ? { kind: "existing", conversationId: lookup.data.id }
    : { kind: "new" };
}
