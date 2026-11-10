"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";
import type { Query } from "@/lib/api/http";
import type { Uuid } from "@/lib/api/types";
import { authHref } from "@/lib/next-path";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { listFlagsQuery } from "../api/favorite-queries";
import { mayFavorite } from "../access";
import type { FlagMap } from "../favorite-flags";
import type { HeartFlag } from "../favorite-view";

type ListFlags = {
  /** The flags by listing `id` once the read with the token is back, else `undefined`. */
  flags: FlagMap | undefined;
  /** The read failed and there is nothing to show. */
  failed: boolean;
  retry: () => void;
  /** Where a guest's heart leads: sign in, then back to this very page. */
  signInHref: string;
};

const ListFlagsContext = createContext<ListFlags | null>(null);

type ListFavoritesProps = {
  /** The path of the list the server drew, such as `/listings`. */
  path: string;
  /** The same query the server sent, so the second read answers the same rows. */
  query: Query;
  /** The cards. They are drawn on the server, so nothing about them changes here. */
  children: ReactNode;
};

/**
 * The overlay of a public list (spec 0001, "Overlay pattern" and "Merge rule"). The server drew
 * the list as a guest and every row carries `isFavorite: null`. For a person who gets a heart
 * this repeats the same call with the token and keeps only the flag of each row, by `id`. The
 * cards are never replaced, so nothing jumps if the list moved between the two reads. A guest, an
 * admin or a landlord makes no second call. It never runs while the session is `loading`.
 *
 * It sits around the server drawn cards as a wrapper with children, so the cards stay server
 * output. It reads the address for the sign in link of a guest, so the page keeps it inside a
 * `<Suspense>` boundary, as the lists of the search page and of a landlord already do.
 */
export function ListFavorites({ path, query, children }: ListFavoritesProps) {
  const api = useApi();
  const session = useSession();
  const pathname = usePathname();
  const search = useSearchParams().toString();

  const userId = mayFavorite(session) ? session.user.id : null;
  const flagsQuery = useQuery({
    ...listFlagsQuery(api, userId ?? "", path, query),
    enabled: userId !== null,
  });

  const value: ListFlags = {
    flags: flagsQuery.data,
    failed: flagsQuery.isError && flagsQuery.data === undefined,
    retry: () => void flagsQuery.refetch(),
    signInHref: authHref(
      "/login",
      search === "" ? pathname : `${pathname}?${search}`,
    ),
  };

  return <ListFlagsContext value={value}>{children}</ListFlagsContext>;
}

/**
 * What the heart of one card needs from its list: the flag, how to read it again, and the sign
 * in address. A row the second read did not return (the list moved between the two reads) counts
 * as not saved. A flag the read gave as `null` stays `null`, which is "unknown", never a guess.
 */
export function useListHeart(id: Uuid): {
  flag: HeartFlag;
  retry: () => void;
  signInHref: string;
} {
  const list = useContext(ListFlagsContext);
  if (list === null) throw new Error("Put the cards inside <ListFavorites>.");

  const { flags, failed, retry, signInHref } = list;
  const flag: HeartFlag =
    flags !== undefined
      ? id in flags
        ? flags[id]
        : false
      : failed
        ? null
        : undefined;
  return { flag, retry, signInHref };
}
