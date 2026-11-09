import { parsePageParam } from "@/features/listing-search/schemas/search-params";

/**
 * The page of reviews an address asks for, from its `reviewPage` parameter (spec 0013, AC-11): a
 * whole number from 1, anything else is 1. It never throws, so the API never answers 400 to a
 * request this zone made. It is the same reading as the `page` of the listings above it (one rule
 * for what a bad page means), kept under its own name because the two parameters are separate.
 */
export const parseReviewPage = (raw: string | null | undefined): number =>
  parsePageParam(raw);
