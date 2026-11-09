"use client";

import { useQuery } from "@tanstack/react-query";
import { byListingQuery } from "@/features/chat/api/chat-queries";
import { chatBasePath } from "@/features/chat/access";
import { mayChatAbout, toChatEntry } from "@/features/chat/chat-entry";
import { ChatEntrySlot } from "@/features/chat/components/chat-entry-slot";
import { landlordPath } from "@/features/landlord-profile/landlord-id";
import { formatDateTime } from "@/lib/format";
import { authHref } from "@/lib/next-path";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { listingDetailQuery } from "../api/listing-detail-query";
import { ContactPanel } from "./contact-panel";
import { toContactView } from "./contact-view";

type ListingContactProps = {
  /** The id of the listing, for the chat: it is what `POST /listings/:id/conversations` takes. */
  id: string;
  /** The title, shown in the first message dialog. */
  title: string;
  /** The 8 character code, for the phone read. */
  code: string;
  /** The canonical address from the answer, where sign in and register come back to. */
  path: string;
  landlord: { id: string; name: string | null };
  /** `createdAt` as the API sent it. */
  createdAt: string;
};

/**
 * The contact zone (spec 0010, AC-7 to AC-9, and spec 0012, AC-3). It reads who is looking and,
 * for a signed in person who is not the landlord, reads the listing again with the token to get
 * the phone number, which is never in the server HTML. It turns the session and the query into
 * one `ContactView` and hands it to `ContactPanel`.
 *
 * The "Nhắn cho chủ trọ" control is a second, separate read: it asks whether this renter already
 * has a conversation about the listing. It does not depend on the phone read, so a phone that
 * fails to load never takes the button with it.
 */
export function ListingContact({
  id,
  title,
  code,
  path,
  landlord,
  createdAt,
}: ListingContactProps) {
  const api = useApi();
  const session = useSession();

  // Only a signed in person who is not the landlord needs the read. Never while `loading`.
  const reads = session.status === "user" && session.user.id !== landlord.id;
  const query = useQuery({ ...listingDetailQuery(api, code), enabled: reads });

  // Only someone who may chat looks for an old conversation, so no other account makes a chat
  // request. Never while `loading`.
  const lookup = useQuery({
    ...byListingQuery(api, id),
    enabled: mayChatAbout(session, landlord.id),
  });

  const landlordName = landlord.name ?? "Chủ trọ";
  const signInHref = authHref("/login", path);

  return (
    <ContactPanel
      view={toContactView(session, landlord.id, query)}
      landlordName={landlordName}
      landlordHref={landlordPath(landlord.id)}
      postedAt={formatDateTime(createdAt)}
      signInHref={signInHref}
      registerHref={authHref("/register", path)}
      onRetry={() => void query.refetch()}
      chat={
        <ChatEntrySlot
          entry={toChatEntry(session, { landlord }, lookup)}
          signInHref={signInHref}
          basePath={
            session.status === "user"
              ? chatBasePath(session.user.accountType)
              : null
          }
          listing={{ id, title }}
          landlordName={landlordName}
        />
      }
    />
  );
}
