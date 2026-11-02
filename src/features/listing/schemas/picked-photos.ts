import { isApiError } from "@/lib/api/errors";
import type { FieldError, ListingImage, Uuid } from "@/lib/api/types";
import { MAX_PHOTOS } from "./photo-rules";

// The pure rules of the photos chosen in the post form (spec 0006, AC-6, AC-7, AC-17 and AC-18).
// The hook `usePickedPhotos` keeps the list; everything it decides lives here.

/**
 * The limit of the post call. Five photos of 5 MiB are 25 MiB, which a connection of about
 * 1.2 Mbps sends in 180 seconds. It is a guess, so it is one constant.
 */
export const POST_TIMEOUT_MS = 180_000;

/** The device and the server clocks may differ, so a listing counts if it is this much older. */
export const RECOVERY_WINDOW_MS = 10 * 60_000;

/** One photo chosen in the post form. `previewUrl` is an object URL with exactly one owner. */
export interface PickedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

/** The photos with `added` after them. A list never holds more than five. */
export const addPicked = (
  list: readonly PickedPhoto[],
  added: readonly PickedPhoto[],
): readonly PickedPhoto[] => [...list, ...added].slice(0, MAX_PHOTOS);

/** The list with the photo `id` one place earlier (`-1`) or later (`1`). Edges stay as they are. */
export function movePicked(
  list: readonly PickedPhoto[],
  id: string,
  step: -1 | 1,
): readonly PickedPhoto[] {
  const from = list.findIndex((photo) => photo.id === id);
  const to = from + step;
  if (from === -1 || to < 0 || to >= list.length) return list;
  return list.map((photo, index) => {
    if (index === from) return list[to];
    if (index === to) return list[from];
    return photo;
  });
}

export const removePicked = (list: readonly PickedPhoto[], id: string) =>
  list.filter((photo) => photo.id !== id);

/** True when both lists hold the same photos in the same order. */
export const sameIds = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, index) => id === b[index]);

/** "Ảnh bìa" for the first photo, "Ảnh 2", "Ảnh 3" and so on for the others. */
export const pickedLabel = (index: number) =>
  index === 0 ? "Ảnh bìa" : `Ảnh ${index + 1}`;

/**
 * What a screen reader hears after a move. Places are counted from 1. The cover is named when
 * the moved photo became it, or when it was the cover and left.
 */
export function movedText(from: number, to: number) {
  const direction = to < from ? "lên" : "xuống";
  const coverNote =
    to === 1
      ? ", thành ảnh bìa"
      : from === 1
        ? ", ảnh bìa đã đổi sang ảnh khác"
        : "";
  return `Ảnh ${from} đã chuyển ${direction} vị trí ${to}${coverNote}`;
}

/**
 * Where a failed post points: `marks` maps a photo id to the backend message of its row
 * (`images.N`, N counted from 0 in the order sent), and `zone` is the message of a row that
 * names `images` without a photo. Rows for anything else are left to the form level message.
 */
export function photoErrors(
  errors: readonly FieldError[],
  sent: readonly { id: string }[],
): { marks: Readonly<Record<string, string>>; zone: string | null } {
  const marks: Record<string, string> = {};
  let zone: string | null = null;
  for (const { field, message } of errors) {
    const match = /^images\.(\d+)$/.exec(field);
    if (match) {
      const photo = sent[Number(match[1])];
      if (photo !== undefined) marks[photo.id] ??= message;
    } else if (field === "images") {
      zone ??= message;
    }
  }
  return { marks, zone };
}

/** The photo previews keyed by the saved image they belong to: both lists in the order sent. */
export function previewsByImageId(
  images: readonly ListingImage[],
  previews: readonly PickedPhoto[],
): Readonly<Record<Uuid, string>> {
  const sorted = images.toSorted((a, b) => a.position - b.position);
  return Object.fromEntries(
    sorted.flatMap((image, index) =>
      previews[index] === undefined
        ? []
        : [[image.id, previews[index].previewUrl]],
    ),
  );
}

/** What the form remembers about a post whose answer was lost (spec 0006, AC-18). */
export interface PostAttempt {
  /** The device clock when the post was sent. */
  startedAt: number;
  propertyId: Uuid;
  title: string;
  price: number;
  areaM2: number;
  sentPhotoIds: readonly string[];
}

/**
 * Is it unknown whether the post was saved? True for no answer at all (status 0), a 5xx (the
 * backend can fail after saving, contract 6.18) and an answer that cannot be read (it can follow
 * a 201). A definite 4xx, a 429 included, means nothing was saved.
 */
export const isUnknownOutcome = (error: unknown) =>
  !isApiError(error) ||
  error.status === 0 ||
  error.status >= 500 ||
  error.code === "INVALID_RESPONSE";

/**
 * The listing of `items` that came from `attempt`: the newest one with the same title, price and
 * area, made no earlier than ten minutes before the attempt began. The summary carries no
 * property id, so these fields are the key; the caller confirms the match by reading it whole.
 */
export function matchPosted<
  T extends { title: string; price: number; areaM2: number; createdAt: string },
>(attempt: PostAttempt, items: readonly T[]): T | undefined {
  const earliest = attempt.startedAt - RECOVERY_WINDOW_MS;
  return items
    .filter(
      (item) =>
        item.title === attempt.title &&
        item.price === attempt.price &&
        item.areaM2 === attempt.areaM2 &&
        Date.parse(item.createdAt) >= earliest,
    )
    .toSorted((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
}
