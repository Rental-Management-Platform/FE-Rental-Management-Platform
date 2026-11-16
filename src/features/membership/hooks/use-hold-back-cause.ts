"use client";

import { holdBackCause, type HoldBackCause } from "../membership-text";
import { useMembership } from "./use-membership";

/**
 * The cause of a listing being held back from guests, read from the shared membership entry
 * (spec 0020, AC-10). `null` when the answer is not loaded (or the person may not read it), or
 * when neither cause holds. A failed read after a good one keeps the last good answer, so the
 * cause does not disappear.
 */
export function useHoldBackCause(): HoldBackCause | null {
  const { query } = useMembership();
  return holdBackCause(query.data);
}
