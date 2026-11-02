"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleAlertIcon,
  ImageOffIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// Phone: two tiles a row, then three. The browser picks a file size from this.
const TILE_SIZES = "(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 44vw";

/** Shown in place of a saved photo the page cannot load and has no local copy of (AC-10). */
const NOT_PUBLIC_NOTE = "Ảnh chỉ xem được khi tin đang công khai";

export type PhotoTileProps =
  | {
      kind: "saved";
      /** The address from `mediaUrl`, or `null` when the path was not a photo path. */
      src: string | null;
      alt: string;
      /** The first photo of the listing. */
      isCover: boolean;
      /** "Ảnh bìa" for the cover, "Ảnh 2", "Ảnh 3" and so on for the others. */
      label: string;
      /**
       * The object URL of the file this photo came from, when this page has it. It stands in when
       * the saved address answers an error: the backend serves a photo only while its listing is
       * public, and an `img` request carries no token (spec 0007, AC-10).
       */
      fallbackSrc?: string | null;
    }
  | {
      kind: "queued";
      /** The object URL of the picked file. */
      src: string;
      alt: string;
      fileName: string;
      onRemove: () => void;
    }
  | {
      kind: "uploading";
      src: string;
      alt: string;
      fileName: string;
    }
  | {
      kind: "failed";
      src: string;
      alt: string;
      fileName: string;
      /** The backend's words, or `null` when the photo was never sent ("Chưa tải"). */
      message: string | null;
      /** `null` when the same file would fail again, so only "Bỏ" is offered. */
      onRetry: (() => void) | null;
      /** Held back while a 429 countdown runs. */
      retryDisabled: boolean;
      onRemove: () => void;
    }
  | {
      /** A photo chosen in the post form, before the listing exists (spec 0006, AC-17). */
      kind: "picked";
      src: string;
      alt: string;
      fileName: string;
      /** Names the buttons of this tile for the focus moves of the zone. */
      photoId: string;
      /** The place on screen, counted from 1: it names the buttons ("Bỏ ảnh 2"). */
      place: number;
      isCover: boolean;
      label: string;
      /** The backend's words about this photo after a failed post, or `null`. */
      message: string | null;
      /** The id of the element that holds `message`, named by the remove button. */
      messageId: string;
      canMoveUp: boolean;
      canMoveDown: boolean;
      /** True while the form is sending: the order must match the order sent. */
      disabled: boolean;
      onMoveUp: () => void;
      onMoveDown: () => void;
      onRemove: () => void;
    };

// Which picture a tile shows. A saved photo whose address failed shows its local copy, else a
// note; every other kind shows a file picked on this device.
function pickImage(props: PhotoTileProps, loadFailed: boolean) {
  if (props.kind !== "saved") {
    return { src: props.src, isLocal: true, showNote: false };
  }
  if (!loadFailed) return { src: props.src, isLocal: false, showNote: false };
  const fallback = props.fallbackSrc ?? null;
  return {
    src: fallback,
    isLocal: fallback !== null,
    showNote: fallback === null,
  };
}

// One photo in the grid. It only draws a state and makes no data calls, so `/dev/ui` can show
// every state on fake data. The words of a state sit under the photo, on a solid background,
// never on the photo itself, and a state is never told by color alone.
export function PhotoTile(props: PhotoTileProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const image = pickImage(props, loadFailed);
  // A photo that is still on its way is dimmed; a chosen one is shown as it is.
  const isDimmed =
    props.kind === "queued" ||
    props.kind === "uploading" ||
    props.kind === "failed";
  const isMarked = props.kind === "picked" && props.message !== null;

  return (
    <li className="flex min-w-0 flex-col gap-2">
      <div
        className={cn(
          "relative aspect-4/3 overflow-hidden rounded-lg border bg-muted",
          isMarked && "border-destructive",
        )}
      >
        {image.src === null ? (
          <div
            role="img"
            aria-label={image.showNote ? NOT_PUBLIC_NOTE : props.alt}
            className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-muted-foreground"
          >
            <ImageOffIcon aria-hidden="true" className="size-8" />
            {image.showNote && (
              <span className="text-xs">{NOT_PUBLIC_NOTE}</span>
            )}
          </div>
        ) : (
          <Image
            src={image.src}
            alt={props.alt}
            fill
            sizes={TILE_SIZES}
            // A picked file is read by the browser, not by the image optimizer.
            unoptimized={image.isLocal}
            onError={
              props.kind === "saved" && !loadFailed
                ? () => setLoadFailed(true)
                : undefined
            }
            className={cn("object-cover", isDimmed && "opacity-70")}
          />
        )}
      </div>
      <TileCaption {...props} />
    </li>
  );
}

function FileName({ name }: { name: string }) {
  return (
    <span className="truncate text-xs text-muted-foreground" title={name}>
      {name}
    </span>
  );
}

function TileCaption(props: PhotoTileProps) {
  switch (props.kind) {
    case "saved":
      return (
        <div className="flex min-h-8 items-center gap-2">
          {props.isCover ? (
            <Badge>{props.label}</Badge>
          ) : (
            <span className="text-sm text-muted-foreground">{props.label}</span>
          )}
        </div>
      );
    case "picked":
      return (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 min-w-0 flex-col justify-center gap-0.5">
            {/* One fixed height, so the button rows line up whether or not the badge is there. */}
            <div className="flex h-6 items-center">
              {props.isCover ? (
                <Badge>{props.label}</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {props.label}
                </span>
              )}
            </div>
            <FileName name={props.fileName} />
          </div>
          {props.message !== null && (
            <div id={props.messageId} className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                <CircleAlertIcon aria-hidden="true" className="size-4" />
                Ảnh chưa dùng được
              </span>
              {/* The backend's own words, so long ones wrap inside the tile. */}
              <span className="text-sm break-words">{props.message}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              data-photo-action={`${props.photoId}:up`}
              aria-label={`Chuyển ảnh ${props.place} lên trước`}
              disabled={props.disabled || !props.canMoveUp}
              onClick={props.onMoveUp}
            >
              <ArrowLeftIcon aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              data-photo-action={`${props.photoId}:down`}
              aria-label={`Chuyển ảnh ${props.place} ra sau`}
              disabled={props.disabled || !props.canMoveDown}
              onClick={props.onMoveDown}
            >
              <ArrowRightIcon aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              data-photo-action={`${props.photoId}:remove`}
              aria-label={`Bỏ ảnh ${props.place}`}
              aria-describedby={
                props.message === null ? undefined : props.messageId
              }
              disabled={props.disabled}
              onClick={props.onRemove}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
        </div>
      );
    case "queued":
      return (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 min-w-0 flex-col justify-center gap-0.5">
            <span className="text-sm font-medium">Đang chờ</span>
            <FileName name={props.fileName} />
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              aria-label={`Bỏ ảnh ${props.fileName}`}
              onClick={props.onRemove}
            >
              Bỏ
            </Button>
          </div>
        </div>
      );
    case "uploading":
      return (
        <div className="flex min-h-8 min-w-0 flex-col justify-center gap-0.5">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {/* The words beside it already say it, so a screen reader skips the spinner. */}
            <Spinner size="sm" aria-hidden="true" />
            Đang tải
          </span>
          <FileName name={props.fileName} />
        </div>
      );
    case "failed":
      return (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            {props.message === null ? (
              <span className="text-sm font-medium">Chưa tải</span>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-sm font-medium text-destructive">
                  <CircleAlertIcon aria-hidden="true" className="size-4" />
                  Không tải được
                </span>
                {/* The backend's own words, so long ones wrap inside the tile. */}
                <span className="text-sm break-words">{props.message}</span>
              </>
            )}
            <FileName name={props.fileName} />
          </div>
          <div className="flex flex-wrap gap-2">
            {props.onRetry !== null && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={props.retryDisabled}
                aria-label={`Thử lại ảnh ${props.fileName}`}
                onClick={props.onRetry}
              >
                Thử lại
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              aria-label={`Bỏ ảnh ${props.fileName}`}
              onClick={props.onRemove}
            >
              Bỏ
            </Button>
          </div>
        </div>
      );
  }
}
