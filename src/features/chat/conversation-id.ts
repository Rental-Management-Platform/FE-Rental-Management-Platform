import { z } from "zod";

// The shape of an id, not a check that it is a version 4 or 7 one: the backend decides what it
// accepts, and this only has to catch an address that cannot be an id.
const idShape = z.guid();

/**
 * True when the text has the shape of a UUID. A conversation page checks this first, so an address
 * such as `/tin-nhan/abc` shows "not found" without spending a request (spec 0012, AC-8).
 */
export const isConversationId = (value: unknown): value is string =>
  idShape.safeParse(value).success;
