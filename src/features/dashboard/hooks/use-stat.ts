"use client";

import { useQueries } from "@tanstack/react-query";
import type { StatKey } from "@/components/shells/workspace-tools";
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
  /** What the sources gave so far, for a card that reacts to a value (the first steps badge). */
  values: readonly SourceValue[];
}

interface SourceResult {
  status: "pending" | "error" | "success";
  data: SourceValue | undefined;
  error: unknown;
}

/**
 * The slot of one card from the state of its sources. A failed source wins over a loading one,
 * so the error shows at once; and when one of two sources fails the slot shows the error and no
 * lines (spec 0008, AC-10). Pure, so it can be read on its own.
 */
export function settleStat(
  stat: StatKey,
  results: readonly SourceResult[],
): StatState {
  if (results.length === 0) return { kind: "none" };
  const failed = results.find((result) => result.status === "error");
  if (failed) return { kind: "error", error: failed.error };
  if (results.some((result) => result.status === "pending")) {
    return { kind: "loading" };
  }
  const lines = describeStat(
    stat,
    results.flatMap((result) => (result.data ? [result.data] : [])),
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

  return {
    state:
      stat === undefined
        ? { kind: "none" }
        : settleStat(
            stat,
            results.map(({ status, data, error }) => ({ status, data, error })),
          ),
    values: results.flatMap(({ data }) => (data ? [data] : [])),
  };
}
