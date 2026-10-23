import { HouseIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Full class names, so Tailwind can see them.
const RATIO_CLASS = {
  "4:3": "aspect-4/3",
  "16:9": "aspect-video",
  "1:1": "aspect-square",
} as const;

// Shown when the caller has no image URL (a listing's `coverImageUrl` is null). The width
// fills the card, the ratio keeps the box from jumping when a photo does load elsewhere.
export function ImagePlaceholder({
  ratio = "4:3",
  className,
}: {
  ratio?: keyof typeof RATIO_CLASS;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label="Chưa có ảnh"
      className={cn(
        "flex w-full items-center justify-center rounded-lg bg-muted text-muted-foreground",
        RATIO_CLASS[ratio],
        className,
      )}
    >
      <HouseIcon aria-hidden="true" className="size-10" />
    </div>
  );
}
