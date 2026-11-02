import { ImageOffIcon } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { UploadStatus } from "../hooks/use-photo-uploads";

// Phone: two tiles a row, then three, then four. The browser picks a file size from this.
const TILE_SIZES = "(min-width: 1024px) 14vw, (min-width: 640px) 28vw, 44vw";

const STATUS_TEXT: Record<UploadStatus, string> = {
  queued: "Đang chờ",
  uploading: "Đang tải",
};

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
      kind: "pending";
      /** The object URL of the picked file. */
      src: string;
      alt: string;
      status: UploadStatus;
      fileName: string;
    };

// One photo in the grid. It only draws a state and makes no data calls, so `/dev/ui` can show
// every state on fake data. The words of a state sit under the photo, on a solid background,
// never on the photo itself, and a state is never told by color alone.
export function PhotoTile(props: PhotoTileProps) {
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
            // A picked file is read by the browser, not by the image optimizer.
            unoptimized={props.kind === "pending"}
            className={
              props.kind === "pending"
                ? "object-cover opacity-70"
                : "object-cover"
            }
          />
        )}
      </div>
      {props.kind === "saved" ? (
        <div className="flex min-h-8 items-center gap-2">
          {props.isCover ? (
            <Badge>{props.label}</Badge>
          ) : (
            <span className="text-sm text-muted-foreground">{props.label}</span>
          )}
        </div>
      ) : (
        <div className="flex min-h-8 min-w-0 flex-col justify-center gap-0.5">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {/* The words beside it already say it, so a screen reader skips the spinner. */}
            {props.status === "uploading" && (
              <Spinner size="sm" aria-hidden="true" />
            )}
            {STATUS_TEXT[props.status]}
          </span>
          <span
            className="truncate text-xs text-muted-foreground"
            title={props.fileName}
          >
            {props.fileName}
          </span>
        </div>
      )}
    </li>
  );
}
