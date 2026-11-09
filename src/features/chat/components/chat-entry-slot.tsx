"use client";

import Link from "next/link";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Uuid } from "@/lib/api/types";
import type { ChatEntry } from "../chat-entry";
import { FirstMessageDialog } from "./first-message-dialog";

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
 * settles.
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
        {entry.kind === "checking" && (
          <>
            {/* With scripts off the session never resolves, so the skeleton hides and the sign
                in link stands in. */}
            <div aria-busy="true" className="noscript:hidden">
              <span className="sr-only">Đang kiểm tra tin nhắn</span>
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <noscript>
              <GuestLink signInHref={signInHref} />
            </noscript>
          </>
        )}

        {entry.kind === "guest" && <GuestLink signInHref={signInHref} />}

        {entry.kind === "existing" && basePath !== null && (
          <Button asChild variant="outline" size="lg">
            <Link href={`${basePath}/${entry.conversationId}`}>
              Xem tin nhắn của bạn
            </Link>
          </Button>
        )}

        {entry.kind === "new" && basePath !== null && (
          <FirstMessageDialog
            listingId={listing.id}
            listingTitle={listing.title}
            landlordName={landlordName}
            basePath={basePath}
          />
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
