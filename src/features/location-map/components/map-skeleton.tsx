import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MAP_HEIGHT_CLASS } from "../config";

/**
 * The box shown while the map module or the ward box is on its way. It has the height of the map
 * (20 rem on a phone, 25 rem from `md`), so the page does not jump when the map arrives.
 */
export function MapSkeleton({
  heightClassName = MAP_HEIGHT_CLASS,
}: {
  heightClassName?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(heightClassName, "w-full")}
    >
      <Skeleton className="size-full rounded-lg" />
      <span className="sr-only">Đang tải bản đồ</span>
    </div>
  );
}
