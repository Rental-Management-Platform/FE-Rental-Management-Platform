"use client";

import Link from "next/link";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Uuid } from "@/lib/api/types";
import type { ChatEntry } from "../chat-entry";
import { ChatEntryControl } from "./chat-entry-control";

interface ChatEntrySlotProps {
  entry: ChatEntry;
  /** The sign in address that comes back to this listing, for a guest. */
  signInHref: string;
  /** The inbox of the viewer (`chatBasePath`), `null` for someone who has no chat. */
  basePath: string | null;
  listing: { id: Uuid; title: string };
  /** The name from the listing, or "Chủ trọ" when the landlord has none. */
  landlordName: string;
}

const BUTTON = "Nhắn cho chủ trọ";

/**
 * The chat part of the contact card, one view for each `ChatEntry` (spec 0012, AC-3). `none`
 * draws nothing, not even the divider. Every other kind draws a divider and one control of the
 * same height, so the card does not jump when the session or the look for an old conversation
 * settles. The control itself is `ChatEntryControl`, which the room reviews hint shares; the slot
 * keeps the divider, the card wrapper and the sign in link of a guest.
 */
export function ChatEntrySlot({
  entry,
  signInHref,
  basePath,
  listing,
  landlordName,
}: ChatEntrySlotProps) {
  if (entry.kind === "none") return null;
  // `new` and `existing` need an inbox to lead to. A viewer without one never gets that far.
  if (
    (entry.kind === "new" || entry.kind === "existing") &&
    basePath === null
  ) {
    return null;
  }

  return (
    <>
      <Separator />
      <CardContent>
        {entry.kind === "guest" ? (
          <GuestLink signInHref={signInHref} />
        ) : (
          <ChatEntryControl
            entry={entry}
            listing={listing}
            landlordName={landlordName}
            basePath={basePath}
          />
        )}
        {/* With scripts off the session never resolves, so the skeleton above hides and the sign
            in link stands in. */}
        {entry.kind === "checking" && (
          <noscript>
            <GuestLink signInHref={signInHref} />
          </noscript>
        )}
      </CardContent>
    </>
  );
}

// A guest keeps the button: it leads to sign in and comes back to the listing.
function GuestLink({ signInHref }: { signInHref: string }) {
  return (
    <Button asChild variant="outline" size="lg">
      <Link href={signInHref}>{BUTTON}</Link>
    </Button>
  );
}
