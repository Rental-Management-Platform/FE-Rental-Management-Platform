import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ROWS = [0, 1, 2];

/** Rows of the shape of the real ones, so the zone does not jump when they arrive. */
export function ReviewRowsSkeleton() {
  return (
    <ul aria-hidden="true" className="flex flex-col divide-y">
      {ROWS.map((row) => (
        <li key={row} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </li>
      ))}
    </ul>
  );
}

/** The write block while `GET /review` is loading: as high as the form, so nothing jumps. */
export function WriteBlockSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4 border-b pb-5">
      <span role="status" className="sr-only">
        Đang kiểm tra trạng thái đánh giá của bạn
      </span>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-11 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-40" />
      </div>
    </div>
  );
}

/**
 * What the profile page shows in place of the reviews zone until it can draw itself (spec 0013,
 * AC-1). The zone reads the address and the session in the browser, so the server HTML holds only
 * this: the heading row and a few rows. No review text ever comes from the server.
 */
export function ReviewsZoneSkeleton() {
  return (
    <Card aria-busy="true">
      <CardHeader className="border-b">
        <Skeleton className="h-5 w-24" aria-hidden="true" />
        <Skeleton className="h-4 w-32" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <span role="status" className="sr-only">
          Đang tải đánh giá
        </span>
        <ReviewRowsSkeleton />
      </CardContent>
    </Card>
  );
}
