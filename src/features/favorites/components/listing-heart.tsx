"use client";

import type { Uuid } from "@/lib/api/types";
import { useHeart } from "../hooks/use-heart";
import { HeartButton } from "./heart-button";
import { useListHeart } from "./list-favorites";

type ListingHeartProps = {
  /** The `id` of the row: `POST /listings/:id/favorite` takes it, never the slug or code. */
  id: Uuid;
  title: string;
};

/**
 * The heart on a card of a public list (scope #14). It gets its flag from the overlay around the
 * list (`ListFavorites`) by the `id` of its row, and shares the press with the other hearts
 * (`useHeart`). It goes in the `heart` slot of `ListingCard`.
 */
export function ListingHeart({ id, title }: ListingHeartProps) {
  const { flag, retry, signInHref } = useListHeart(id);
  const heart = useHeart({ listingId: id, flag });

  return (
    <HeartButton
      view={heart.view}
      shape="icon"
      title={title}
      pending={heart.pending}
      locked={heart.locked}
      announcement={heart.announcement}
      signInHref={signInHref}
      onToggle={heart.toggle}
      onRetry={retry}
    />
  );
}
