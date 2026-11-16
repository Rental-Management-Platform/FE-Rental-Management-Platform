import { queryOptions } from "@tanstack/react-query";
import { amenitiesQuery } from "@/features/amenities/api/amenities-query";
import { wardBoundsQuery } from "@/features/wards/api/wards-query";
import type { ApiClient } from "@/lib/api/client";
import type {
  Amenity,
  AmenityBody,
  AmenityPatch,
  CatalogWard,
  WardBody,
  WardPatch,
} from "@/lib/api/types";

/**
 * The wards as the admin table reads them: the public list with every `bounds`
 * (`GET /wards`, api-for-frontend.md 6.15), under the same key the ward map of the landlord forms
 * uses, so one `invalidateQueries({ queryKey: wardsKey })` after a write reaches both. That key
 * keeps its answer for the whole visit, which is right for a landlord form and wrong for the page
 * that edits it, so this one reads again every time the page opens (`staleTime: 0`).
 */
export const adminWardsQuery = (api: ApiClient) =>
  queryOptions({ ...wardBoundsQuery(api), staleTime: 0 });

/** The amenities as the admin table reads them: the public list, read again when the page opens. */
export const adminAmenitiesQuery = (api: ApiClient) =>
  queryOptions({ ...amenitiesQuery(api), staleTime: 0 });

/**
 * `POST /wards` (`catalog:create`, api-for-frontend.md 6.30): the new ward, a 201 answer with
 * `bounds: null`. A code that exists, a seeded one too, is a 409 `CATALOG_CODE_TAKEN`. Mutations
 * never retry (spec 0002), so a press sends one request.
 */
export const createWard = (api: ApiClient, body: WardBody) =>
  api.post<CatalogWard>("/wards", body);

/**
 * `PATCH /wards/:code` (`catalog:update`): the ward after the change, `bounds` as they were. Only
 * the two names are taken, and a key in the body is a 400.
 */
export const updateWard = (api: ApiClient, code: string, patch: WardPatch) =>
  api.patch<CatalogWard>(`/wards/${encodeURIComponent(code)}`, patch);

/**
 * `DELETE /wards/:code` (`catalog:delete`), a 204 answer. A ward that any property names, a
 * deleted one too, answers 409 `CATALOG_IN_USE`: it can only be renamed.
 */
export const deleteWard = (api: ApiClient, code: string) =>
  api.delete<void>(`/wards/${encodeURIComponent(code)}`);

/** `POST /amenities` (`catalog:create`): the new amenity, a 201 answer. */
export const createAmenity = (api: ApiClient, body: AmenityBody) =>
  api.post<Amenity>("/amenities", body);

/** `PATCH /amenities/:key` (`catalog:update`): the amenity after the rename. */
export const updateAmenity = (
  api: ApiClient,
  key: string,
  patch: AmenityPatch,
) => api.patch<Amenity>(`/amenities/${encodeURIComponent(key)}`, patch);

/** `DELETE /amenities/:key` (`catalog:delete`), a 204 answer, or 409 `CATALOG_IN_USE`. */
export const deleteAmenity = (api: ApiClient, key: string) =>
  api.delete<void>(`/amenities/${encodeURIComponent(key)}`);
