"use client";

import { useQuery } from "@tanstack/react-query";
import { listingDetailQuery } from "@/features/listing-detail/api/listing-detail-query";
import type { Uuid } from "@/lib/api/types";
import { authHref } from "@/lib/next-path";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { mayFavorite } from "../access";
import type { HeartFlag } from "../favorite-view";
import { useHeart } from "../hooks/use-heart";
import { HeartButton } from "./heart-button";

type DetailHeartProps = {
  /** The `id` of the listing: `POST /listings/:id/favorite` takes it, never the slug or code. */
  id: Uuid;
  /** The 8 character code, which is the key of the browser read of the detail. */
  code: string;
  title: string;
  /** The canonical address from the answer, where sign in comes back to. */
  path: string;
};

/**
 * The heart in the title row of the detail page (scope #14, spec 0010). It reads `isFavorite`
 * from the same browser read the phone number uses, under `["listing-detail", code]`, so a signed
 * in person never makes a second read for it. That read answers `isFavorite` only with a token,
 * so the server HTML has a placeholder and no flag. It runs only for a person who gets a heart,
 * and never while the session is `loading`.
 */
export function DetailHeart({ id, code, title, path }: DetailHeartProps) {
  const api = useApi();
  const session = useSession();
  const query = useQuery({
    ...listingDetailQuery(api, code),
    enabled: mayFavorite(session),
  });

  // A flag that is there is used even when a later read failed. With no flag, a failed read is
  // `null` and a read still on its way is `undefined`.
  const flag: HeartFlag =
    query.data !== undefined
      ? query.data.isFavorite
      : query.isError
        ? null
        : undefined;

  const heart = useHeart({ listingId: id, flag });

  return (
    <HeartButton
      view={heart.view}
      shape="labeled"
      title={title}
      pending={heart.pending}
      locked={heart.locked}
      announcement={heart.announcement}
      signInHref={authHref("/login", path)}
      onToggle={heart.toggle}
      onRetry={() => void query.refetch()}
    />
  );
}
