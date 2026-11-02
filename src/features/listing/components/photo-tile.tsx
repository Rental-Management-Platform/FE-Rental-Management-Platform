import { CircleAlertIcon, ImageOffIcon } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Phone: two tiles a row, then three. The browser picks a file size from this.
const TILE_SIZES = "(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 44vw";

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
    };

// One photo in the grid. It only draws a state and makes no data calls, so `/dev/ui` can show
// every state on fake data. The words of a state sit under the photo, on a solid background,
// never on the photo itself, and a state is never told by color alone.
export function PhotoTile(props: PhotoTileProps) {
  // A picked file is read by the browser, not by the image optimizer.
  const isLocal = props.kind !== "saved";

  return (
    <li className="flex min-w-0 flex-col gap-2">
      <div className="relative aspect-4/3 overflow-hidden rounded-lg border bg-muted">
        {props.src === null ? (
          <div
            role="img"
            aria-label={props.alt}
            className="flex size-full items-center justify-center text-muted-foreground"
          >
            <ImageOffIcon aria-hidden="true" className="size-8" />
          </div>
        ) : (
          <Image
            src={props.src}
            alt={props.alt}
            fill
            sizes={TILE_SIZES}
            unoptimized={isLocal}
            className={isLocal ? "object-cover opacity-70" : "object-cover"}
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
