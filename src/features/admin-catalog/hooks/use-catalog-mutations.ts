"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { amenitiesKey } from "@/features/amenities/api/amenities-query";
import { wardsKey } from "@/features/wards/api/wards-query";
import { isApiError } from "@/lib/api/errors";
import type {
  AmenityBody,
  AmenityPatch,
  WardBody,
  WardPatch,
} from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import {
  createAmenity,
  createWard,
  deleteAmenity,
  deleteWard,
  updateAmenity,
  updateWard,
} from "../api/catalog";

/**
 * The six writes of the catalog page. Each one marks the public list it changed out of date and
 * waits for it to be read again before it resolves, so the table already shows the new state when
 * a dialog closes. The same key is the one the landlord forms read, so their ward picker, ward map
 * and amenity boxes see the change the next time they open (api-for-frontend.md, 6.30: a list
 * kept for the visit should be read again after an admin edit). A 404 also marks the list out of
 * date, so a row another admin already deleted leaves even though the write failed.
 */
export function useCatalogMutations() {
  const api = useApi();
  const queryClient = useQueryClient();
  const refreshWards = () =>
    queryClient.invalidateQueries({ queryKey: wardsKey });
  const refreshAmenities = () =>
    queryClient.invalidateQueries({ queryKey: amenitiesKey });
  const refreshWhenGone =
    (refresh: () => Promise<void>) => (error: unknown) => {
      if (isApiError(error) && error.status === 404) void refresh();
    };

  const addWard = useMutation({
    mutationFn: (body: WardBody) => createWard(api, body),
    onSuccess: refreshWards,
  });
  const renameWard = useMutation({
    mutationFn: ({ code, patch }: { code: string; patch: WardPatch }) =>
      updateWard(api, code, patch),
    onSuccess: refreshWards,
    onError: refreshWhenGone(refreshWards),
  });
  const removeWard = useMutation({
    mutationFn: (code: string) => deleteWard(api, code),
    onSuccess: refreshWards,
    onError: refreshWhenGone(refreshWards),
  });
  const addAmenity = useMutation({
    mutationFn: (body: AmenityBody) => createAmenity(api, body),
    onSuccess: refreshAmenities,
  });
  const renameAmenity = useMutation({
    mutationFn: ({ key, patch }: { key: string; patch: AmenityPatch }) =>
      updateAmenity(api, key, patch),
    onSuccess: refreshAmenities,
    onError: refreshWhenGone(refreshAmenities),
  });
  const removeAmenity = useMutation({
    mutationFn: (key: string) => deleteAmenity(api, key),
    onSuccess: refreshAmenities,
    onError: refreshWhenGone(refreshAmenities),
  });

  return {
    addWard,
    renameWard,
    removeWard,
    addAmenity,
    renameAmenity,
    removeAmenity,
  };
}
