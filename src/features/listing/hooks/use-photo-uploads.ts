"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useReducer, useRef, useState } from "react";
import type { ApiError } from "@/lib/api/errors";
import type { ListingImage, Uuid } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import {
  cacheAddImage,
  classifyUploadError,
  findNewImage,
  knownImageIds,
  refreshImages,
  uploadListingImage,
  type UploadFailure,
} from "../api/listing-images";
import type { ListingBlock } from "../api/owner-listing";
import {
  freeSlots,
  splitPicked,
  type SkippedFile,
} from "../schemas/photo-rules";
import { useLeaveWarning } from "./use-leave-warning";

export type UploadStatus = "queued" | "uploading" | "failed";

/** One picked file on its way to the server. It leaves the list once it is saved or dropped. */
export interface UploadItem {
  localId: string;
  file: File;
  /** An object URL of the file, for the tile. */
  previewUrl: string;
  status: UploadStatus;
  /**
   * Failed only. The words of the failure, or `null` when the file was never sent because the
   * queue stopped before its turn ("Chưa tải").
   */
  message: string | null;
  /** Failed only. False when the same file would fail again, so only "Bỏ" is offered. */
  retryable: boolean;
  /**
   * The saved photo ids from before a send whose outcome was never settled (no answer came, and
   * the read after it failed too). While it is set, the next try reads the listing first and
   * sends only when the photo is not there (spec 0007, AC-9).
   */
  checkAgainst: readonly Uuid[] | null;
}

type UploadAction =
  | { type: "add"; items: readonly UploadItem[] }
  | { type: "start"; localId: string }
  | {
      type: "fail";
      localId: string;
      message: string | null;
      retryable: boolean;
      checkAgainst: readonly Uuid[] | null;
    }
  | { type: "failQueued" }
  | { type: "retry"; localId: string }
  | { type: "remove"; localId: string }
  | { type: "dropActive" };

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
    case "fail":
      return items.map((item) =>
        item.localId === action.localId
          ? {
              ...item,
              status: "failed",
              message: action.message,
              retryable: action.retryable,
              checkAgainst: action.checkAgainst,
            }
          : item,
      );
    // The queue stopped: every photo still waiting becomes "not uploaded", free to try again.
    case "failQueued":
      return items.map((item) =>
        item.status === "queued"
          ? { ...item, status: "failed", message: null, retryable: true }
          : item,
      );
    case "retry":
      return items.map((item) =>
        item.localId === action.localId && item.status === "failed"
          ? { ...item, status: "queued", message: null }
          : item,
      );
    case "remove":
      return items.filter((item) => item.localId !== action.localId);
    // The session changed: what was waiting or in flight has nowhere to go.
    case "dropActive":
      return items.filter((item) => item.status === "failed");
  }
}

/** How far the photos of one run have come, for the words a screen reader hears. */
interface Batch {
  total: number;
  sent: number;
  saved: number;
}

type Check =
  { ok: true; image: ListingImage | undefined } | { ok: false; error: unknown };

/**
 * The upload queue of the photo zone (spec 0007). Picked files go out one at a time, in the order
 * they were picked, because the backend takes one file per request (api-for-frontend.md, 6.28).
 * Each saved photo is written into the listing's cache entry at once.
 *
 * Two things move together: `items` (what the tiles show) and `waiting` (what is still to be
 * sent, in order). The loop is started from a handler, never from an effect, and only one loop
 * runs at a time. A photo that is wrong in itself fails alone and the queue goes on; any other
 * failure stops the queue, and the photos that had not been sent become "Chưa tải".
 *
 * `onBlocked` is called when the listing is gone or is not the person's (the page takes over).
 */
export function usePhotoUploads(
  listingId: Uuid,
  savedCount: number,
  onBlocked: (block: ListingBlock) => void,
) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [items, dispatch] = useReducer(uploadsReducer, []);
  const [skipped, setSkipped] = useState<readonly SkippedFile[]>([]);
  const [rateLimit, setRateLimit] = useState<ApiError | null>(null);
  const [announcement, setAnnouncement] = useState("");
  // Saved photo id to the object URL of the file it came from, a fallback for a photo the page
  // cannot load (AC-4 and AC-10).
  const [previews, setPreviews] = useState<Readonly<Record<Uuid, string>>>({});

  const waiting = useRef<UploadItem[]>([]);
  const running = useRef(false);
  const alive = useRef(false);
  const counter = useRef(0);
  const batch = useRef<Batch>({ total: 0, sent: 0, saved: 0 });
  // Every object URL made here, so none outlives the zone.
  const urls = useRef(new Set<string>());
  // The latest callback, because a request that started earlier calls it when it ends.
  const blocked = useRef(onBlocked);

  useEffect(() => {
    blocked.current = onBlocked;
  });

  // Leaving the zone: what has not been sent is dropped, the request in flight finishes and
  // still updates the cache (spec 0007, AC-11).
  useEffect(() => {
    alive.current = true;
    const created = urls.current;
    const queue = waiting;
    return () => {
      alive.current = false;
      queue.current = [];
      for (const url of created) URL.revokeObjectURL(url);
      created.clear();
    };
  }, []);

  // Closing the tab or reloading asks first while a photo is waiting or on its way (AC-11).
  useLeaveWarning(items.some((item) => item.status !== "failed"));

  const release = (url: string) => {
    URL.revokeObjectURL(url);
    urls.current.delete(url);
  };

  const announce = (text: string) => {
    if (alive.current) setAnnouncement(text);
  };

  // A new run starts counting from zero. A photo added while the loop runs joins the run.
  const countIn = (added: number) => {
    if (!running.current && waiting.current.length === 0) {
      batch.current = { total: 0, sent: 0, saved: 0 };
    }
    batch.current.total += added;
  };

  // The photo is on the server: it joins the cache, and its tile becomes a saved one.
  const saved = (item: UploadItem, image: ListingImage) => {
    cacheAddImage(queryClient, listingId, image);
    setPreviews((current) => ({ ...current, [image.id]: item.previewUrl }));
    batch.current.saved += 1;
    dispatch({ type: "remove", localId: item.localId });
  };

  // The queue stops here. This photo fails with `message` and what was waiting becomes "Chưa tải".
  const stopQueue = (
    item: UploadItem,
    message: string | null,
    retryable: boolean,
    checkAgainst: readonly Uuid[] | null,
  ) => {
    const unsent = waiting.current.length;
    dispatch({
      type: "fail",
      localId: item.localId,
      message,
      retryable,
      checkAgainst,
    });
    dispatch({ type: "failQueued" });
    waiting.current = [];
    announce(
      [
        message === null
          ? `${item.file.name} chưa được tải.`
          : `Không tải được ${item.file.name}. ${message}`,
        unsent > 0 ? `${unsent} ảnh khác chưa được tải.` : "",
      ]
        .join(" ")
        .trim(),
    );
  };

  // Reads the listing and looks for a photo that was not there before the send. It never throws.
  const checkForNew = async (known: readonly Uuid[]): Promise<Check> => {
    try {
      const images = await refreshImages(api, queryClient, listingId);
      return { ok: true, image: findNewImage(known, images) };
    } catch (error) {
      return { ok: false, error };
    }
  };

  // A photo that did not go through. Says whether the queue goes on. `afterRead` is true when
  // the failure is that of the read which follows an upload without an answer.
  const finish = async (
    item: UploadItem,
    failure: UploadFailure,
    known: readonly Uuid[],
    afterRead: boolean,
  ): Promise<"next" | "stop"> => {
    // A failed read leaves it unsettled whether the photo is saved: the next try reads first.
    const unsettled = afterRead ? known : null;
    switch (failure.kind) {
      case "aborted":
        // The session changed under the request: there is nothing to show, the gate takes over.
        for (const dropped of [item, ...waiting.current]) {
          release(dropped.previewUrl);
        }
        waiting.current = [];
        dispatch({ type: "dropActive" });
        return "stop";
      case "file":
        // The same file would fail again, so only "Bỏ" is offered, and the queue goes on (AC-7).
        dispatch({
          type: "fail",
          localId: item.localId,
          message: failure.message,
          retryable: false,
          checkAgainst: null,
        });
        announce(`Không tải được ${item.file.name}. ${failure.message}`);
        return "next";
      case "blocked":
        stopQueue(item, failure.message, false, null);
        // Not when the zone is gone: the person may be looking at another listing by now.
        if (alive.current) blocked.current(failure.block);
        return "stop";
      case "rate-limit":
        setRateLimit(failure.error);
        stopQueue(item, null, true, unsettled);
        return "stop";
      case "full":
        stopQueue(item, failure.message, true, null);
        // Another tab may have filled the listing: the tiles must match the server (AC-8).
        await refreshImages(api, queryClient, listingId).catch(() => undefined);
        return "stop";
      case "unknown-outcome": {
        if (afterRead) {
          stopQueue(item, failure.message, true, known);
          return "stop";
        }
        // No answer came, so the photo may be saved already. Read the listing before calling
        // it failed, so a second copy is never made (AC-9).
        const checked = await checkForNew(known);
        if (checked.ok && checked.image !== undefined) {
          saved(item, checked.image);
          return "next";
        }
        if (checked.ok) {
          stopQueue(item, failure.message, true, null);
          return "stop";
        }
        return finish(item, classifyUploadError(checked.error), known, true);
      }
      case "stop":
        stopQueue(item, failure.message, true, unsettled);
        return "stop";
    }
  };

  // Sends one photo. A try that follows an unsettled one reads the listing before it sends.
  const sendOne = async (item: UploadItem): Promise<"next" | "stop"> => {
    const known = item.checkAgainst ?? knownImageIds(queryClient, listingId);
    if (item.checkAgainst !== null) {
      const checked = await checkForNew(known);
      if (!checked.ok) {
        return finish(item, classifyUploadError(checked.error), known, true);
      }
      if (checked.image !== undefined) {
        saved(item, checked.image);
        return "next";
      }
    }
    try {
      saved(item, await uploadListingImage(api, listingId, item.file));
      return "next";
    } catch (error) {
      return finish(item, classifyUploadError(error), known, false);
    }
  };

  const run = async () => {
    for (
      let next = waiting.current.shift();
      next !== undefined;
      next = waiting.current.shift()
    ) {
      dispatch({ type: "start", localId: next.localId });
      batch.current.sent += 1;
      announce(
        `Đang tải ảnh ${batch.current.sent} trên ${batch.current.total}`,
      );
      if ((await sendOne(next)) === "stop") return;
    }
    const { saved: done, sent } = batch.current;
    if (done > 0) {
      announce(
        done === sent
          ? `Đã tải xong ${done} ảnh`
          : `Đã tải ${done} ảnh, ${sent - done} ảnh không tải được`,
      );
    }
  };

  // Sends the waiting items one by one. A second call while a loop runs does nothing: the
  // running loop picks the new items up when it gets to them.
  const drain = async () => {
    if (running.current) return;
    running.current = true;
    try {
      await run();
    } finally {
      running.current = false;
    }
    // Something was queued while the loop was closing (a retry after the queue stopped).
    if (alive.current && waiting.current.length > 0) void drain();
  };

  /** Checks the picked files, lists the ones left out, and queues the rest. */
  const enqueue = (files: readonly File[]) => {
    const inQueue = items.filter((item) => item.status !== "failed").length;
    const { accepted, skipped: leftOut } = splitPicked(
      files,
      freeSlots(savedCount, inQueue),
    );
    setSkipped(leftOut);
    if (accepted.length === 0) return;
    setRateLimit(null);
    const added = accepted.map((file): UploadItem => {
      counter.current += 1;
      const previewUrl = URL.createObjectURL(file);
      urls.current.add(previewUrl);
      return {
        localId: String(counter.current),
        file,
        previewUrl,
        status: "queued",
        message: null,
        retryable: true,
        checkAgainst: null,
      };
    });
    countIn(added.length);
    waiting.current.push(...added);
    dispatch({ type: "add", items: added });
    void drain();
  };

  /** "Thử lại": a failed photo goes to the back of the queue. */
  const retry = (localId: string) => {
    const item = items.find((candidate) => candidate.localId === localId);
    if (item === undefined || item.status !== "failed" || !item.retryable) {
      return;
    }
    // One click, one request: a photo that is already waiting is not queued twice.
    if (waiting.current.some((queued) => queued.localId === localId)) return;
    setRateLimit(null);
    countIn(1);
    waiting.current.push({ ...item, status: "queued", message: null });
    dispatch({ type: "retry", localId });
    void drain();
  };

  /** "Bỏ": a waiting or failed photo leaves the list. A photo on its way cannot be taken back. */
  const remove = (localId: string) => {
    const item = items.find((candidate) => candidate.localId === localId);
    if (item === undefined || item.status === "uploading") return;
    waiting.current = waiting.current.filter(
      (queued) => queued.localId !== localId,
    );
    release(item.previewUrl);
    dispatch({ type: "remove", localId });
  };

  return {
    items,
    skipped,
    rateLimit,
    announcement,
    previews,
    enqueue,
    retry,
    remove,
  };
}
