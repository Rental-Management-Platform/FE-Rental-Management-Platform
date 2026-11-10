"use client";

import type { SavedListing } from "@/lib/api/types";
import { useHeart } from "../hooks/use-heart";
import { HeartButton } from "./heart-button";

type SavedHeartProps = {
  listing: Pick<SavedListing, "id" | "title">;
  /** Told after the unsave went through, while the card is still there to ask for it. */
  onUnsaved: () => void;
};

/**
 * The heart on a card of the saved page. Every row is saved (`isFavorite` is always `true` in
 * this list), so the heart starts filled and a press unsaves. The answer takes the row out of the
 * cache (`syncFavorite`), so the card leaves the page. It has no sign in link and no flag read:
 * the route gate has already let a signed in renter in, and the flag is the row itself.
 */
export function SavedHeart({ listing, onUnsaved }: SavedHeartProps) {
  const heart = useHeart({
    listingId: listing.id,
    flag: true,
    onChanged: (saved) => {
      if (!saved) onUnsaved();
    },
  });

  return (
    <HeartButton
      view={heart.view}
      shape="icon"
      title={listing.title}
      pending={heart.pending}
      locked={heart.locked}
      announcement={heart.announcement}
      signInHref="/login"
      onToggle={heart.toggle}
      onRetry={() => undefined}
    />
  );
}
