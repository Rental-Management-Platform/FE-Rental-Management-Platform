"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlertIcon, ImagePlusIcon } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Uuid } from "@/lib/api/types";
import { mediaUrl } from "@/lib/media";
import { useApi } from "@/lib/session/auth-provider";
import { useCountdown } from "@/lib/use-countdown";
import { useReturnFocus } from "@/lib/use-return-focus";
import { savedImages } from "../api/listing-images";
import { ownerListingQuery, type ListingBlock } from "../api/owner-listing";
import { useDeletePhoto } from "../hooks/use-delete-photo";
import { usePhotoUploads } from "../hooks/use-photo-uploads";
import {
  ACCEPT_ATTRIBUTE,
  COVER_HELP,
  LAST_PHOTO_HELP,
  MAX_PHOTOS,
  PHOTO_HELP,
  skippedText,
} from "../schemas/photo-rules";
import { DeletePhotoDialog } from "./delete-photo-dialog";
import { PhotoTile } from "./photo-tile";

// Where focus goes once a deleted photo has left the grid: the delete button of the tile now at
// that place, else of the one before it.
const DELETE_BUTTONS = '[data-photo-action$=":delete"]';

// The photo zone of a listing (spec 0007). It sits outside the listing form and saves each photo
// the moment it is uploaded, so it never changes the form's dirty state. The saved photos are
// read from the same cache entry as the page (`["listing","mine",id]`), which the page has
// already loaded: this reader never asks the server on its own.
export function ListingPhotos({
  listingId,
  seedPreviews,
  onBlocked,
}: {
  listingId: string;
  /**
   * Saved photo id to the object URL of the file it was chosen as in the post form. Lent by the
   * result view, which owns and frees them: this zone only shows them, and only for a photo
   * whose saved address cannot be loaded (spec 0007, AC-10).
   */
  seedPreviews?: Readonly<Record<string, string>>;
  /**
   * The listing is gone or is not mine: the page replaces itself with that state, or the result
   * view shows `message` (the backend's words) in place of the zone.
   */
  onBlocked: (block: ListingBlock, message: string) => void;
}) {
  const api = useApi();
  const titleId = useId();
  const helpId = useId();
  const lastPhotoHelpId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // The words of the last delete that failed. It clears on the next pick or delete (AC-6).
  const [notice, setNotice] = useState<string | null>(null);
  // The photo the dialog is about, with the place it had when the dialog opened. It is kept while
  // the dialog fades out, after the photo has left the cache.
  const [pending, setPending] = useState<{ id: Uuid; index: number } | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  // Set by a delete that worked: the place the photo had in the grid. Left empty otherwise.
  const focusAfterDelete = useRef<number | null>(null);
  const { data: images = [] } = useQuery({
    ...ownerListingQuery(api, listingId),
    staleTime: Infinity,
    select: savedImages,
  });
  const {
    items,
    skipped,
    rateLimit,
    announcement,
    previews,
    enqueue,
    retry,
    remove,
  } = usePhotoUploads(listingId, images.length, onBlocked);
  // Pick and retry wait for the countdown of a 429 to end.
  const waitSeconds = useCountdown(rateLimit);
  const isFull = images.length >= MAX_PHOTOS;
  // A listing keeps at least one photo (backend rule of 2026-11-02), so delete is off at one.
  const canDelete = images.length > 1;

  const { isDeleting, deletePhoto } = useDeletePhoto(listingId);
  // One dialog serves every saved tile, so it has no trigger of its own. When it closes, focus
  // goes back to the button that opened it if that tile is still there. If not (the photo was
  // deleted), it goes to the neighbour tile, and failing that to "Thêm ảnh" (AC-6).
  const { remember, onCloseAutoFocus } = useReturnFocus(() => {
    const place = focusAfterDelete.current;
    focusAfterDelete.current = null;
    const buttons = Array.from(
      contentRef.current?.querySelectorAll<HTMLElement>(DELETE_BUTTONS) ?? [],
    );
    if (place !== null && buttons.length > 0) {
      return buttons[Math.min(place, buttons.length - 1)];
    }
    return addRef.current ?? buttons[0];
  });

  const askDelete = (imageId: Uuid, index: number) => {
    // A press while the button is off does nothing (the button keeps its place in the tab order).
    if (!canDelete) return;
    remember();
    focusAfterDelete.current = null;
    setPending({ id: imageId, index });
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (pending === null) return;
    setNotice(null);
    const result = await deletePhoto(pending.id);
    if (result === null) return;
    switch (result.kind) {
      case "removed":
        toast.success("Đã xóa ảnh");
        focusAfterDelete.current = pending.index;
        break;
      case "already-gone":
        toast("Ảnh đã được xóa trước đó");
        focusAfterDelete.current = pending.index;
        break;
      case "required":
      case "failed":
        setNotice(result.message);
        break;
      case "blocked":
        onBlocked(result.block, result.message);
        break;
      case "aborted":
        break;
    }
    setDialogOpen(false);
  };

  // The place a waiting photo will take once it is saved, after the photos already there.
  const placeOf = new Map(
    items
      .filter((item) => item.status !== "failed")
      .map((item, index) => [item.localId, images.length + index + 1]),
  );

  return (
    <Card role="group" aria-labelledby={titleId}>
      <CardHeader className="border-b">
        {/* The count shares the title row, so the line below keeps the full width on a phone. */}
        <CardTitle className="flex items-baseline justify-between gap-3">
          <h2 id={titleId} className="text-base">
            Ảnh của tin
          </h2>
          <span className="text-sm font-normal text-muted-foreground">
            {images.length} trên {MAX_PHOTOS} ảnh
          </span>
        </CardTitle>
        <CardDescription>
          Ảnh được lưu ngay khi tải lên, bạn không cần bấm Lưu.
        </CardDescription>
      </CardHeader>
      <CardContent ref={contentRef} className="flex flex-col gap-4">
        {/* A failed delete, in the backend's words. It clears on the next pick or delete. */}
        {notice !== null && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>{notice}</AlertTitle>
          </Alert>
        )}
        <RateLimitNotice error={rateLimit} />
        {images.length + items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tin chưa có ảnh. Hãy thêm ảnh để người thuê thấy phòng.
          </p>
        ) : (
          <>
            {/* Three columns at most: a failed tile holds two 44 px buttons side by side. */}
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.map((image, index) => (
                <PhotoTile
                  key={image.id}
                  kind="saved"
                  src={mediaUrl(image.url)}
                  alt={`Ảnh ${index + 1} của tin`}
                  isCover={index === 0}
                  label={index === 0 ? "Ảnh bìa" : `Ảnh ${index + 1}`}
                  fallbackSrc={previews[image.id] ?? seedPreviews?.[image.id]}
                  photoId={image.id}
                  place={index + 1}
                  canDelete={canDelete}
                  deleteReasonId={canDelete ? undefined : lastPhotoHelpId}
                  onDelete={() => askDelete(image.id, index)}
                />
              ))}
              {items.map((item) => {
                const alt = `Ảnh ${placeOf.get(item.localId) ?? item.file.name} của tin`;
                switch (item.status) {
                  case "queued":
                    return (
                      <PhotoTile
                        key={item.localId}
                        kind="queued"
                        src={item.previewUrl}
                        alt={alt}
                        fileName={item.file.name}
                        onRemove={() => remove(item.localId)}
                      />
                    );
                  case "uploading":
                    return (
                      <PhotoTile
                        key={item.localId}
                        kind="uploading"
                        src={item.previewUrl}
                        alt={alt}
                        fileName={item.file.name}
                      />
                    );
                  case "failed":
                    return (
                      <PhotoTile
                        key={item.localId}
                        kind="failed"
                        src={item.previewUrl}
                        alt={`Ảnh chưa tải: ${item.file.name}`}
                        fileName={item.file.name}
                        message={item.message}
                        onRetry={
                          item.retryable ? () => retry(item.localId) : null
                        }
                        retryDisabled={waitSeconds > 0}
                        onRemove={() => remove(item.localId)}
                      />
                    );
                }
              })}
            </ul>
            {/* What to do to change the cover. With one photo it is also why delete is off. */}
            {images.length === 1 && (
              <p id={lastPhotoHelpId} className="text-sm text-muted-foreground">
                {LAST_PHOTO_HELP}
              </p>
            )}
            {images.length >= 2 && (
              <p className="text-sm text-muted-foreground">{COVER_HELP}</p>
            )}
          </>
        )}
        {isFull ? (
          <p className="text-sm text-muted-foreground">
            Đã đủ {MAX_PHOTOS} ảnh. Hãy xóa bớt một ảnh trước nếu muốn thêm.
          </p>
        ) : (
          <div className="flex flex-col items-start gap-2">
            {/* Kept in the DOM and out of the tab order: the button below is the control. */}
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTRIBUTE}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              onChange={(event) => {
                setNotice(null);
                // The list is copied first, because clearing the value empties it.
                enqueue(Array.from(event.target.files ?? []));
                // So the same file can be picked again.
                event.target.value = "";
              }}
            />
            <Button
              ref={addRef}
              type="button"
              variant="outline"
              size="lg"
              disabled={waitSeconds > 0}
              aria-describedby={helpId}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlusIcon aria-hidden="true" />
              Thêm ảnh
            </Button>
            <p id={helpId} className="text-sm text-muted-foreground">
              {PHOTO_HELP}
            </p>
          </div>
        )}
        {/* The files left out of a pick, read out when they appear (AC-3). */}
        <div aria-live="polite">
          {skipped.length > 0 && (
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-medium">Một số ảnh chưa được thêm:</p>
              <ul className="list-disc pl-5">
                {skipped.map((file, index) => (
                  <li key={`${file.name}-${index}`}>{skippedText(file)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* Progress and failures for a screen reader, never shown (AC-14). */}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
        <DeletePhotoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isCover={pending?.index === 0}
          isDeleting={isDeleting}
          onConfirm={() => void confirmDelete()}
          onCloseAutoFocus={onCloseAutoFocus}
        />
      </CardContent>
    </Card>
  );
}
