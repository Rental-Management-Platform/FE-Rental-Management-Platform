"use client";

import { useQueries } from "@tanstack/react-query";
import type { StatKey } from "@/components/shells/workspace-tools";
import { isApiError } from "@/lib/api/errors";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import {
  SOURCE_PERMISSION,
  SOURCES_OF,
  sourceQuery,
  type SourceValue,
} from "../api/stats";
import { describeStat } from "../stat-text";

// What the number slot of a card draws.
export type StatState =
  // No slot: the card has no number, or the person may read none of its sources.
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "error"; error: unknown }
  | { kind: "lines"; lines: readonly string[] };

export interface Stat {
  state: StatState;
  /** What the sources gave, for a card that reacts to a value (the first steps badge). */
  values: readonly SourceValue[];
  /** Fetches the failed sources again. */
  retry: () => void;
}

export interface SourceResult {
  status: "pending" | "error" | "success";
  /** `fetching` while a request is out, also on a source that failed before. */
  fetchStatus: "fetching" | "paused" | "idle";
  data: SourceValue | undefined;
  error: unknown;
}

// The API says this person may not read the source (an admin took the permission away). The
// source is dropped, and the others still count: a card hides its slot only when none is left.
const isDenied = (result: SourceResult) =>
  result.status === "error" &&
  isApiError(result.error) &&
  result.error.status === 403 &&
  result.error.code === "PERMISSION_DENIED";

// A source that failed and is being fetched again counts as loading, so "Thử lại" shows
// progress instead of the old error. A source that has data keeps showing it while it refreshes.
const isLoading = (result: SourceResult) =>
  result.status === "pending" ||
  (result.status === "error" && result.fetchStatus === "fetching");

/**
 * The slot of one card from the state of its sources (spec 0008, AC-10). A source the person
 * may not read is dropped. A failed source shows the error, and when one of two sources fails
 * the slot shows the error and no lines. Pure, so it can be read on its own.
 */
export function settleStat(
  stat: StatKey,
  results: readonly SourceResult[],
): StatState {
  const usable = results.filter((result) => !isDenied(result));
  if (usable.length === 0) return { kind: "none" };
  if (usable.some(isLoading)) return { kind: "loading" };
  const failed = usable.find((result) => result.status === "error");
  if (failed) return { kind: "error", error: failed.error };

  const lines = describeStat(
    stat,
    usable.flatMap((result) => (result.data ? [result.data] : [])),
  );
  return lines.length === 0 ? { kind: "none" } : { kind: "lines", lines };
}

/**
 * The number of one card (spec 0008, AC-7): one small query per source, each requested only when
 * the person holds the permission its API needs. A card with no number passes `undefined`.
 */
export function useStat(stat: StatKey | undefined): Stat {
  const api = useApi();
  const session = useSession();
  const sources = (stat === undefined ? [] : SOURCES_OF[stat]).filter((name) =>
    can(session, SOURCE_PERMISSION[name]),
  );
  const results = useQueries({
    queries: sources.map((name) => sourceQuery(api, name)),
  });

  const snapshots = results.map(
    ({ status, fetchStatus, data, error }): SourceResult => ({
      status,
      fetchStatus,
      data,
      error,
    }),
  );

  return {
    state: stat === undefined ? { kind: "none" } : settleStat(stat, snapshots),
    // Only what loaded: a count that failed on its last fetch must not keep a highlight alive.
    values: snapshots.flatMap(({ status, data }) =>
      status === "success" && data ? [data] : [],
    ),
    retry: () => {
      results.forEach((result, index) => {
        if (snapshots[index].status === "error" && !isDenied(snapshots[index]))
          void result.refetch();
      });
    },
  };
}
