"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/format";
import { authHref } from "@/lib/next-path";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { listingDetailQuery } from "../api/listing-detail-query";
import { ContactPanel } from "./contact-panel";
import { toContactView } from "./contact-view";

type ListingContactProps = {
  /** The 8 character code, for the phone read. */
  code: string;
  /** The canonical address from the answer, where sign in and register come back to. */
  path: string;
  landlord: { id: string; name: string | null };
  /** `createdAt` as the API sent it. */
  createdAt: string;
};

/**
 * The contact zone (spec 0010, AC-7 to AC-9). It reads who is looking and, for a signed in person
 * who is not the landlord, reads the listing again with the token to get the phone number, which
 * is never in the server HTML. It turns the session and the query into one `ContactView` and
 * hands it to `ContactPanel`.
 */
export function ListingContact({
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

  return (
    <ContactPanel
      view={toContactView(session, landlord.id, query)}
      landlordName={landlord.name ?? "Chủ trọ"}
      postedAt={formatDateTime(createdAt)}
      signInHref={authHref("/login", path)}
      registerHref={authHref("/register", path)}
      onRetry={() => void query.refetch()}
    />
  );
}
