import type { ApiClient } from "@/lib/api/client";
import type { Property, PropertyBody } from "@/lib/api/types";

/** `POST /properties` (api-for-frontend.md, 6.17): the new property, with `fullAddress` joined by the backend. */
export const createProperty = (api: ApiClient, body: PropertyBody) =>
  api.post<Property>("/properties", body);
