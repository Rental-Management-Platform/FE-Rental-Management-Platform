// Which state takes a whole conversation page when its reads fail (spec 0012, AC-20).

import { isApiError } from "@/lib/api/errors";

/** A failure that replaces the page, as opposed to one that shows a line and keeps the page. */
export type ThreadBlock = "not-found" | "forbidden" | "rate-limited" | "error";

type Read = { isError: boolean; data: unknown; error: unknown };

const isGone = (error: unknown) =>
  isApiError(error) &&
  (error.code === "CONVERSATION_NOT_FOUND" || error.code === "INVALID_ID");

/**
 * The head and the messages are read together and decide one state for the whole page.
 *
 * A failure takes the page only while that read has no data. Once it has data, a later failure
 * is a poll that missed, and a line says so (AC-10). The one exception is "not found": a
 * conversation that disappears while it is open is gone, whatever is on the screen.
 *
 * Between failures the order is the order of importance: not found, then not allowed, then a
 * wait, then anything else.
 */
export function threadBlock(
  reads: readonly Read[],
): { block: ThreadBlock; error: unknown } | null {
  const failed = reads.filter((read) => read.isError);
  const gone = failed.find((read) => isGone(read.error));
  if (gone) return { block: "not-found", error: gone.error };

  const first = failed.filter((read) => read.data === undefined);
  const pick = (test: (error: unknown) => boolean) =>
    first.find((read) => test(read.error));

  const denied = pick(
    (error) => isApiError(error) && error.code === "PERMISSION_DENIED",
  );
  if (denied) return { block: "forbidden", error: denied.error };
  const limited = pick((error) => isApiError(error) && error.status === 429);
  if (limited) return { block: "rate-limited", error: limited.error };
  const other = first[0];
  return other ? { block: "error", error: other.error } : null;
}
