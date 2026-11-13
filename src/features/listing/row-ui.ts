import type { ApiError } from "@/lib/api/errors";

// What one row of "Tin của tôi" holds on its own, apart from the server data (spec 0019,
// "State lives in"): whether a write is running, and the line under the row about the last one.

export type RowNotice =
  /** A refusal the person can act on (no plan, limit reached) or a state that moved. Not an error. */
  | { kind: "warning"; message: string }
  /** The call failed. Nothing was sent again by itself. */
  | { kind: "error"; message: string }
  /** A 429: the buttons of the row stay locked while the wait counts down. */
  | { kind: "rate-limited"; error: ApiError };

export interface RowUi {
  pending: boolean;
  notice: RowNotice | null;
}

export const IDLE_ROW: RowUi = { pending: false, notice: null };
