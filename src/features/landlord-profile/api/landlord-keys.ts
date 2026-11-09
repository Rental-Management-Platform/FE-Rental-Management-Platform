/**
 * The keys of the landlord queries in the browser. `profile` is the one key the follow button, the
 * header and the reviews zone (spec 0013) all read, so a follow or a new review changes them
 * together. It has no viewer id: the whole cache is emptied when the session ends and read again
 * when the person changes (spec 0002).
 */
export const landlordKeys = {
  all: ["landlord"] as const,
  profile: (landlordId: string) => ["landlord", landlordId, "profile"] as const,
};
