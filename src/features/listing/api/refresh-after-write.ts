import type { QueryClient } from "@tanstack/react-query";
import { dashboardKey } from "@/features/dashboard/api/stats";
import { membershipKey } from "@/features/membership/api/membership-query";
import { myListingsKey } from "./my-listings";

/**
 * What to read again after a write that can change how many listings a landlord may show (hide,
 * show, delete, and posting). Hiding one listing can let another one become public, so the
 * `isPublic` of the rows on screen cannot be trusted any more (spec 0019, "Key invariants").
 *
 * - The page that is open is read again now: this call resolves when that read is done.
 * - The membership answer (the numbers of the status strip, spec 0020, AC-5) is read again now
 *   too when something on screen uses it, and marked out of date when nothing does.
 * - The other cached pages are only marked out of date, and read when they are next opened.
 * - The dashboard numbers are marked out of date and not read now: nobody is looking at them.
 */
export async function refreshAfterListingWrite(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: myListingsKey }),
    queryClient.invalidateQueries({ queryKey: membershipKey }),
    queryClient.invalidateQueries({
      queryKey: dashboardKey,
      refetchType: "none",
    }),
  ]);
}
