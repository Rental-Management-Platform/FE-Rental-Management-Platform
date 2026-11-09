"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LandlordProfile } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { followLandlord, unfollowLandlord } from "../api/follow-api";
import { landlordKeys } from "../api/landlord-keys";
import { classifyFollowError } from "../follow-errors";

/**
 * Follows (`true`) or unfollows (`false`) one landlord. There is no optimistic change: the page
 * changes when the server has answered, and the answer is the whole profile read again after the
 * write, so it goes straight into `landlordKeys.profile(id)` with no second read. The button, the
 * follower count and the header all follow it.
 *
 * It never retries by itself. When the landlord is gone (404) the profile is read again, so the
 * page shows its "not found" state and not a stale button.
 */
export function useFollow(landlordId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (follow: boolean) =>
      follow
        ? followLandlord(api, landlordId)
        : unfollowLandlord(api, landlordId),
    onSuccess: (profile) => {
      queryClient.setQueryData<LandlordProfile>(
        landlordKeys.profile(landlordId),
        profile,
      );
    },
    onError: (error) => {
      const failure = classifyFollowError(error);
      if (failure.kind === "message" && failure.reload) {
        void queryClient.invalidateQueries({
          queryKey: landlordKeys.profile(landlordId),
        });
      }
    },
  });
}
