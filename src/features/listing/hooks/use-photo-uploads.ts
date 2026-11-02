"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useReducer, useRef, useState } from "react";
import { isAbortError } from "@/lib/api/abort";
import { describeError } from "@/lib/api/errors";
import { useApi } from "@/lib/session/auth-provider";
import { cacheAddImage, uploadListingImage } from "../api/listing-images";
import {
  freeSlots,
  splitPicked,
  type SkippedFile,
} from "../schemas/photo-rules";

export type UploadStatus = "queued" | "uploading";

/** One picked file on its way to the server. It leaves the list once it is saved or dropped. */
export interface UploadItem {
  localId: string;
  file: File;
  /** An object URL of the file, for the tile. */
  previewUrl: string;
  status: UploadStatus;
}

type UploadAction =
  | { type: "add"; items: readonly UploadItem[] }
  | { type: "start"; localId: string }
  | { type: "remove"; localId: string }
  | { type: "clear" };

/** What the tiles show. Pure: the queue itself is driven by the hook below. */
export function uploadsReducer(
  items: readonly UploadItem[],
  action: UploadAction,
): readonly UploadItem[] {
  switch (action.type) {
    case "add":
      return [...items, ...action.items];
    case "start":
      return items.map((item) =>
        item.localId === action.localId
          ? { ...item, status: "uploading" }
          : item,
      );
    case "remove":
      return items.filter((item) => item.localId !== action.localId);
    case "clear":
      return [];
  }
}

/**
 * The upload queue of the photo zone (spec 0007). Picked files go out one at a time, in the order
 * they were picked, because the backend takes one file per request (api-for-frontend.md, 6.28).
 * Each saved photo is written into the listing's cache entry at once.
 *
 * Two things move together: `items` (what the tiles show) and `waiting` (what is still to be
 * sent, in order). The loop is started from the pick handler, never from an effect, and only one
 * loop runs at a time. A failed photo stops the queue and drops what was waiting.
 */
export function usePhotoUploads(listingId: string, savedCount: number) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [items, dispatch] = useReducer(uploadsReducer, []);
  const [skipped, setSkipped] = useState<readonly SkippedFile[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const waiting = useRef<UploadItem[]>([]);
  const running = useRef(false);
  const counter = useRef(0);
  // Every object URL made here, so none outlives the zone.
  const urls = useRef(new Set<string>());

  const release = (url: string) => {
    URL.revokeObjectURL(url);
    urls.current.delete(url);
  };

  // Leaving the zone: what has not been sent is dropped, the request in flight finishes and
  // still updates the cache (spec 0007, AC-11).
  useEffect(() => {
    const created = urls.current;
    const queue = waiting;
    return () => {
      queue.current = [];
      for (const url of created) URL.revokeObjectURL(url);
      created.clear();
    };
  }, []);

  // Sends the waiting items one by one. A second call while a loop runs does nothing: the
  // running loop picks the new items up when it gets to them.
  const drain = async () => {
    if (running.current) return;
    running.current = true;
    try {
      for (
        let next = waiting.current.shift();
        next !== undefined;
        next = waiting.current.shift()
      ) {
        dispatch({ type: "start", localId: next.localId });
        try {
          const image = await uploadListingImage(api, listingId, next.file);
          cacheAddImage(queryClient, listingId, image);
          release(next.previewUrl);
          dispatch({ type: "remove", localId: next.localId });
        } catch (error) {
          release(next.previewUrl);
          dispatch({ type: "remove", localId: next.localId });
          // The session changed under the request (a sign out): there is nothing to show.
          if (!isAbortError(error)) setNotice(describeError(error).message);
          // The queue stops here: what was waiting is dropped.
          for (const dropped of waiting.current) release(dropped.previewUrl);
          waiting.current = [];
          dispatch({ type: "clear" });
          return;
        }
      }
    } finally {
      running.current = false;
    }
  };

  /** Checks the picked files, lists the ones left out, and queues the rest. */
  const enqueue = (files: readonly File[]) => {
    setNotice(null);
    const { accepted, skipped: leftOut } = splitPicked(
      files,
      freeSlots(savedCount, items.length),
    );
    setSkipped(leftOut);
    if (accepted.length === 0) return;
    const added = accepted.map((file): UploadItem => {
      counter.current += 1;
      const previewUrl = URL.createObjectURL(file);
      urls.current.add(previewUrl);
      return {
        localId: String(counter.current),
        file,
        previewUrl,
        status: "queued",
      };
    });
    waiting.current.push(...added);
    dispatch({ type: "add", items: added });
    void drain();
  };

  return { items, skipped, notice, enqueue };
}
