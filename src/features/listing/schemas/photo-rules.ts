// The rules for listing photos, as pure functions (spec 0007). The type and size limits are a
// convenience that saves a round trip: the backend judges by file content and has the last word,
// so its `message` is shown whenever it disagrees (AC-3).

/** A listing holds at most five photos (api-for-frontend.md, 6.28). */
export const MAX_PHOTOS = 5;

/** The backend default for `MAX_UPLOAD_BYTES` (5 MiB). Change it here if the backend does. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** One photo may take longer than the client's usual 20 seconds on a weak connection. */
export const UPLOAD_TIMEOUT_MS = 60_000;

export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** The `accept` attribute of the file input. */
export const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(",");

/**
 * The line under the add button of both photo pickers: what is accepted, and a note about the
 * data inside a photo, which the backend keeps (spec 0007, AC-2).
 */
export const PHOTO_HELP = `JPEG, PNG hoặc WebP, mỗi ảnh tối đa 5 MiB, tối đa ${MAX_PHOTOS} ảnh. Ảnh được giữ nguyên thông tin kèm theo, như vị trí chụp nếu máy có ghi.`;

/** Why a picked file was left out. */
export type SkipReason = "type" | "empty" | "size" | "no-slot";

export interface SkippedFile {
  name: string;
  reason: SkipReason;
}

const SKIP_TEXT: Record<Exclude<SkipReason, "no-slot">, string> = {
  type: "không phải ảnh JPEG, PNG hoặc WebP",
  empty: "tệp rỗng",
  size: "lớn hơn 5 MiB",
};

/**
 * Where a pick happens. A listing that exists has "no room" for a file; in the post form there
 * is no listing yet, so the same reason reads as "five photos already" (spec 0006, AC-17).
 */
export type SkipContext = "listing" | "post";

const NO_SLOT_TEXT: Record<SkipContext, string> = {
  listing: "tin đã hết chỗ cho ảnh",
  post: `đã đủ ${MAX_PHOTOS} ảnh`,
};

/** The words for one skipped file, ready for the message under the add button. */
export const skippedText = (
  { name, reason }: SkippedFile,
  context: SkipContext = "listing",
) =>
  `${name}: ${reason === "no-slot" ? NO_SLOT_TEXT[context] : SKIP_TEXT[reason]}`;

/**
 * Why a file cannot be sent, or `null` when it passes. An empty `type` passes, because some
 * systems do not report one and the backend reads the content anyway.
 */
export function checkPhotoFile(file: {
  type: string;
  size: number;
}): Exclude<SkipReason, "no-slot"> | null {
  const knownType = (ACCEPTED_TYPES as readonly string[]).includes(file.type);
  if (file.type !== "" && !knownType) return "type";
  if (file.size <= 0) return "empty";
  if (file.size > MAX_PHOTO_BYTES) return "size";
  return null;
}

/**
 * How many more photos can be added: the five slots minus the saved photos minus the files that
 * are waiting or being sent. Failed files do not take a slot (they hold nothing on the server).
 */
export const freeSlots = (saved: number, inQueue: number) =>
  Math.max(0, MAX_PHOTOS - saved - inQueue);

/**
 * Splits a pick into the files to send and the files to list as skipped. A file that fails the
 * checks never takes a slot; the first files that pass fill the free slots in the order they
 * were picked, and the rest are skipped for lack of room.
 */
export function splitPicked<
  T extends { name: string; type: string; size: number },
>(
  files: readonly T[],
  free: number,
): { accepted: T[]; skipped: SkippedFile[] } {
  const accepted: T[] = [];
  const skipped: SkippedFile[] = [];
  for (const file of files) {
    const reason = checkPhotoFile(file);
    if (reason !== null) {
      skipped.push({ name: file.name, reason });
    } else if (accepted.length < free) {
      accepted.push(file);
    } else {
      skipped.push({ name: file.name, reason: "no-slot" });
    }
  }
  return { accepted, skipped };
}
