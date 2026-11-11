import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { invalidResponseError, isApiError } from "@/lib/api/errors";
import { serverEnv } from "@/lib/env.server";
import { serverGet } from "@/lib/api/server";
import type { Ward } from "@/lib/api/types";

// Shorter than the 10 seconds of `serverGet`, so a hung API does not hold the search bar on its
// fallback for long (spec 0016, AC-10).
const WARDS_TIMEOUT_MS = 3_000;

/**
 * The ward catalog, read on the server as a guest and kept for an hour (spec 0001, the cache
 * table; spec 0016, AC-10). It only changes when an admin edits the catalog, and then
 * `updateTag('catalog')` drops it early.
 *
 * It keeps the four fields the picker reads. The API also sends each ward's `bounds`, about
 * 41 KB for the whole list, and the catalog goes into the page as a prop, so those stay out.
 *
 * A failed read is handled here and not by the caller, because an error thrown out of a `use
 * cache` function reaches the caller as a plain `Error`: it loses `status`, `code` and the name
 * `ApiError`, so the caller could no longer tell a failed read from a bug.
 * - On a live page a failed read (an `ApiError`) returns `null`, and the entry is kept for
 *   seconds only (the documented pattern of a conditional `cacheLife`), so a bad moment of the
 *   API is never kept for the hour. The page gives the search bar no catalog and its ward box
 *   reads it in the browser.
 * - While `next build` renders the page, any failure is thrown, so a build with the API down
 *   fails instead of shutting an empty catalog into the static shell, where it would stay until
 *   the next build (spec 0001, the check it promised the first feature that adds `use cache`).
 * - Anything that is not an `ApiError` is a bug and is thrown too.
 */
export async function getWards(): Promise<Ward[] | null> {
  "use cache";
  cacheTag("catalog");

  try {
    const wards = await serverGet<Ward[]>("/wards", undefined, {
      timeoutMs: WARDS_TIMEOUT_MS,
    });
    if (!Array.isArray(wards)) throw invalidResponseError(200);
    cacheLife("hours");
    return wards.map(({ code, name, provinceCode, provinceName }) => ({
      code,
      name,
      provinceCode,
      provinceName,
    }));
  } catch (error) {
    if (!isApiError(error) || serverEnv.IS_PRODUCTION_BUILD) throw error;
    cacheLife("seconds");
    return null;
  }
}
