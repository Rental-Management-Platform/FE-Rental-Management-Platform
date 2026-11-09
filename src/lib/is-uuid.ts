import { z } from "zod";

// The shape of an id, not a check that it is a version 4 or 7 one: the backend decides what it
// accepts, and this only has to catch an address that cannot be an id.
const idShape = z.guid();

/**
 * True when the text has the shape of a UUID. A page that holds an id from an address checks this
 * first, so a bad address shows "not found", or makes no call at all, without spending one of the
 * shared 300 reads a minute (the contract answers 400 `INVALID_ID` to it).
 */
export const isUuid = (value: unknown): value is string =>
  idShape.safeParse(value).success;
