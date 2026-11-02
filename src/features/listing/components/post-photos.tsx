"use client";

import { CircleAlertIcon, ImagePlusIcon } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FocusRequest } from "../hooks/use-picked-photos";
import {
  ACCEPT_ATTRIBUTE,
  MAX_PHOTOS,
  PHOTO_HELP,
  skippedText,
  type SkippedFile,
} from "../schemas/photo-rules";
import { pickedLabel, type PickedPhoto } from "../schemas/picked-photos";
import { PhotoTile } from "./photo-tile";

interface PostPhotosProps {
  photos: readonly PickedPhoto[];
  /** The files left out of the last pick, with the reason. */
  skipped: readonly SkippedFile[];
  /** What a screen reader hears after a move or a removal. */
  announcement: string;
  focusRequest: FocusRequest | null;
  /** Photo id to the backend's words about that photo, after a failed post. */
  marks: Readonly<Record<string, string>>;
  /** The line under the zone: no photo yet, or a backend row that names no photo. */
  error: string | null;
  /** True while the form is sending: the order of the photos must not change. */
  disabled: boolean;
  onAdd: (files: readonly File[]) => void;
  onMove: (id: string, step: -1 | 1) => void;
  onRemove: (id: string) => void;
}

// The third zone of the post form, "Ảnh của phòng" (spec 0006, AC-17): the picker, the tiles in
// the order that will be sent (the first one is the cover) and the buttons that change that
// order. It holds no photo of its own; `usePickedPhotos` does, and this only draws it and
// carries out the focus moves the hook asks for.
export function PostPhotos({
  photos,
  skipped,
  announcement,
  focusRequest,
  marks,
  error,
  disabled,
  onAdd,
  onMove,
  onRemove,
}: PostPhotosProps) {
  const titleId = useId();
  const helpId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const doneNonce = useRef(0);
  const isFull = photos.length >= MAX_PHOTOS;

  // Carries out a focus request once the change is drawn. While the form is still sending the
  // buttons are off and cannot take focus, so it waits for the form to settle.
  useEffect(() => {
    if (
      focusRequest === null ||
      disabled ||
      focusRequest.nonce === doneNonce.current
    ) {
      return;
    }
    doneNonce.current = focusRequest.nonce;
    const { target } = focusRequest;
    const element =
      target.kind === "add"
        ? addRef.current
        : contentRef.current?.querySelector<HTMLElement>(
            `[data-photo-action="${target.photoId}:${target.action}"]`,
          );
    element?.focus();
  }, [focusRequest, disabled]);

  return (
    <Card
      role="group"
      aria-labelledby={titleId}
      aria-describedby={error === null ? undefined : errorId}
    >
      <CardHeader className="border-b">
        <CardTitle id={titleId}>Ảnh của phòng</CardTitle>
        <CardDescription>
          Chọn từ 1 đến {MAX_PHOTOS} ảnh. Ảnh đầu tiên là ảnh bìa, bạn đổi được
          thứ tự trước khi đăng.
        </CardDescription>
      </CardHeader>
      <CardContent ref={contentRef} className="flex flex-col gap-4">
        {photos.length > 0 && (
          // Three columns at most: a tile holds three 44 px buttons, which wrap on a phone.
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {photos.map((photo, index) => (
              <PhotoTile
                key={photo.id}
                kind="picked"
                src={photo.previewUrl}
                alt={`Ảnh ${index + 1} của tin`}
                fileName={photo.file.name}
                photoId={photo.id}
                place={index + 1}
                isCover={index === 0}
                label={pickedLabel(index)}
                message={marks[photo.id] ?? null}
                messageId={`${photo.id}-${titleId}-message`}
                canMoveUp={index > 0}
                canMoveDown={index < photos.length - 1}
                disabled={disabled}
                onMoveUp={() => onMove(photo.id, -1)}
                onMoveDown={() => onMove(photo.id, 1)}
                onRemove={() => onRemove(photo.id)}
              />
            ))}
          </ul>
        )}
        {isFull ? (
          <p className="text-sm text-muted-foreground">
            Đã đủ {MAX_PHOTOS} ảnh. Hãy bỏ bớt một ảnh nếu muốn đổi.
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
                // The list is copied first, because clearing the value empties it.
                onAdd(Array.from(event.target.files ?? []));
                // So the same file can be picked again.
                event.target.value = "";
              }}
            />
            <Button
              ref={addRef}
              type="button"
              variant="outline"
              size="lg"
              disabled={disabled}
              aria-describedby={
                error === null ? helpId : `${helpId} ${errorId}`
              }
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
        {/* The files left out of a pick, read out when they appear. */}
        <div aria-live="polite">
          {skipped.length > 0 && (
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-medium">Một số ảnh chưa được thêm:</p>
              <ul className="list-disc pl-5">
                {skipped.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    {skippedText(file, "post")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {error !== null && (
          <p
            id={errorId}
            className="flex items-start gap-1.5 text-sm font-medium text-destructive"
          >
            <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4" />
            {error}
          </p>
        )}
        {/* A move or a removal, for a screen reader only. Its own region, apart from the list of
            skipped files above. */}
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
      </CardContent>
    </Card>
  );
}
