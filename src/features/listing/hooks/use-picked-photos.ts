"use client";

import { useEffect, useRef, useState } from "react";
import {
  freeSlots,
  splitPicked,
  type SkippedFile,
} from "../schemas/photo-rules";
import {
  addPicked,
  movedText,
  movePicked,
  removePicked,
  sameIds,
  type PickedPhoto,
} from "../schemas/picked-photos";

/** Where focus goes after a change: the add button, or one button of one tile. */
export type FocusTarget =
  | { kind: "add" }
  | { kind: "tile"; photoId: string; action: "up" | "down" | "remove" };

/**
 * A request to move focus. `nonce` is new for each request, so asking for the same target twice
 * moves focus twice. The zone carries it out after the change has been drawn.
 */
export interface FocusRequest {
  nonce: number;
  target: FocusTarget;
}

// A message is emptied first and set a moment later, so the same words can be read twice.
const ANNOUNCE_DELAY_MS = 100;

/**
 * The photos chosen in the post form (spec 0006, AC-17): their order, their previews, adding,
 * moving and removing. The first photo is the cover. They are held apart from the form's own
 * values because a file is not a field of `listingSchema`.
 *
 * Preview addresses are made only in the handlers below, never while rendering, so React's
 * strict mode cannot free them early. A preview has one owner at a time: this hook, until
 * `handOver` gives it away after a successful post. Everything still owned is freed when a
 * photo is removed and when the form unmounts.
 */
export function usePickedPhotos() {
  const [photos, setPhotos] = useState<readonly PickedPhoto[]>([]);
  const [skipped, setSkipped] = useState<readonly SkippedFile[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  // The latest list for the handlers, because two handlers may run before the next render.
  const latest = useRef<readonly PickedPhoto[]>([]);
  // The object URLs this hook still owns.
  const owned = useRef(new Set<string>());
  const counter = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const urls = owned.current;
    const pending = timer;
    return () => {
      window.clearTimeout(pending.current);
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  const commit = (next: readonly PickedPhoto[]) => {
    latest.current = next;
    setPhotos(next);
  };

  const announce = (text: string) => {
    window.clearTimeout(timer.current);
    setAnnouncement("");
    timer.current = window.setTimeout(
      () => setAnnouncement(text),
      ANNOUNCE_DELAY_MS,
    );
  };

  const requestFocus = (target: FocusTarget) => {
    counter.current += 1;
    setFocusRequest({ nonce: counter.current, target });
  };

  /** Checks the picked files, lists the ones left out, and adds the rest after the others. */
  const add = (files: readonly File[]) => {
    const { accepted, skipped: leftOut } = splitPicked(
      files,
      freeSlots(latest.current.length, 0),
    );
    setSkipped(leftOut);
    if (accepted.length === 0) return;
    const added = accepted.map((file): PickedPhoto => {
      counter.current += 1;
      const previewUrl = URL.createObjectURL(file);
      owned.current.add(previewUrl);
      return { id: `picked-${counter.current}`, file, previewUrl };
    });
    commit(addPicked(latest.current, added));
  };

  /** Moves a photo one place earlier (`-1`) or later (`1`) and keeps focus on the button used. */
  const move = (id: string, step: -1 | 1) => {
    const list = latest.current;
    const from = list.findIndex((photo) => photo.id === id);
    const to = from + step;
    if (from === -1 || to < 0 || to >= list.length) return;
    commit(movePicked(list, id, step));
    announce(movedText(from + 1, to + 1));
    // The pressed button is now on the moved tile. At an edge it is off, so the other one.
    const atEdge = step === -1 ? to === 0 : to === list.length - 1;
    const same = step === -1 ? "up" : "down";
    const other = step === -1 ? "down" : "up";
    requestFocus({
      kind: "tile",
      photoId: id,
      action: atEdge ? other : same,
    });
  };

  /** Removes a photo, frees its preview, and moves focus to the tile now at that place. */
  const remove = (id: string) => {
    const list = latest.current;
    const index = list.findIndex((photo) => photo.id === id);
    if (index === -1) return;
    URL.revokeObjectURL(list[index].previewUrl);
    owned.current.delete(list[index].previewUrl);
    const next = removePicked(list, id);
    commit(next);
    announce(`Đã bỏ ảnh ${index + 1}`);
    const neighbour = next[index] ?? next[index - 1];
    requestFocus(
      neighbour === undefined
        ? { kind: "add" }
        : { kind: "tile", photoId: neighbour.id, action: "remove" },
    );
  };

  /**
   * The post succeeded: gives the previews away, so the list empties and nothing is freed. Only
   * when the list now equals the list that was sent; otherwise nothing is handed over and the
   * previews are freed when the form unmounts. Call it just before the form is replaced.
   */
  const handOver = (sentIds: readonly string[]): readonly PickedPhoto[] => {
    const list = latest.current;
    if (
      !sameIds(
        list.map((photo) => photo.id),
        sentIds,
      )
    ) {
      return [];
    }
    owned.current.clear();
    commit([]);
    return list;
  };

  return {
    photos,
    skipped,
    announcement,
    focusRequest,
    add,
    move,
    remove,
    handOver,
    requestFocus,
  };
}
