"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Uuid } from "@/lib/api/types";
import type { ChatEntry } from "../chat-entry";
import { FirstMessageDialog } from "./first-message-dialog";

export interface ChatEntryControlProps {
  entry: ChatEntry;
  listing: { id: Uuid; title: string };
  /** The name from the listing, or "Chủ trọ" when the landlord has none. */
  landlordName: string;
  /** The inbox of the viewer (`chatBasePath`), `null` for someone who has no chat. */
  basePath: string | null;
  /**
   * The id of a sentence that says what this button is for. The listing page has two message
   * buttons (the contact card and the room reviews hint), and this lets a screen reader tell them
   * apart. Left out in the contact card.
   */
  describedBy?: string;
}

/**
 * The one control of the chat entry (spec 0012, AC-3, taken out of `ChatEntrySlot` by spec 0014,
 * AC-9, so the contact card and the room reviews hint share it): a skeleton while the look for an
 * old conversation runs, "Xem tin nhắn của bạn" (a link) when one exists, and the first message
 * button with its dialog when none does. `guest` and `none` draw nothing here: the sign in link
 * belongs to the contact card (`ChatEntrySlot`), and a viewer who cannot chat has no control.
 */
export function ChatEntryControl({
  entry,
  listing,
  landlordName,
  basePath,
  describedBy,
}: ChatEntryControlProps) {
  switch (entry.kind) {
    case "checking":
      return (
        // With scripts off the session never resolves, so the skeleton hides (the contact card
        // puts the sign in link beside it, in a `<noscript>`).
        <div aria-busy="true" className="noscript:hidden">
          <span className="sr-only">Đang kiểm tra tin nhắn</span>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      );

    case "existing":
      // A viewer without an inbox never gets this far.
      if (basePath === null) return null;
      return (
        <Button asChild variant="outline" size="lg">
          <Link
            href={`${basePath}/${entry.conversationId}`}
            aria-describedby={describedBy}
          >
            Xem tin nhắn của bạn
          </Link>
        </Button>
      );

    case "new":
      if (basePath === null) return null;
      return (
        <FirstMessageDialog
          listingId={listing.id}
          listingTitle={listing.title}
          landlordName={landlordName}
          basePath={basePath}
          describedBy={describedBy}
        />
      );

    case "guest":
    case "none":
      return null;
  }
}
