// The cache keys of chat (spec 0012, "Feature design"). They all start with "chat", and the cache
// is emptied when the session changes, so a key never needs the id of the person.

import type { Uuid } from "@/lib/api/types";

export const chatKeys = {
  /** The count behind the indicator and the landlord dashboard card. */
  unread: () => ["chat", "unread"] as const,
  /** Every page of the inbox, for `invalidateQueries`. */
  inboxAll: () => ["chat", "inbox"] as const,
  inbox: (page: number) => ["chat", "inbox", page] as const,
  /** The head of one conversation: the listing, the other person and the unread count. */
  conversation: (id: Uuid) => ["chat", "conversation", id] as const,
  /** The messages of one conversation, ascending by `seq`. */
  messages: (id: Uuid) => ["chat", "messages", id] as const,
  /** The conversation a renter already has about one listing, or `null`. */
  byListing: (listingId: Uuid) => ["chat", "by-listing", listingId] as const,
};
