"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/session/auth-provider";
import { amenitiesQuery } from "../api/amenities-query";

/** The amenity catalog, read once for the whole visit through the shared `["amenities"]` query. */
export function useAmenities() {
  const api = useApi();
  return useQuery(amenitiesQuery(api));
}
