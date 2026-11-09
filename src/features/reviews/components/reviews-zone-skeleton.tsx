import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingLine } from "./rating-line";

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

type ReviewsZoneSkeletonProps = {
  /** The real heading. Left out, a bar stands in for it. */
  heading?: string;
  /** With `ratingAverage`, the static score line under the heading. Left out, a bar. */
  reviewCount?: number;
  ratingAverage?: number | null;
};

/**
 * What a page shows in place of a reviews area until it can draw itself (spec 0013, AC-1, and spec
 * 0014, AC-1). The area reads the address and the session in the browser, so the server HTML holds
 * only this: the heading row and a few rows. No review text ever comes from the server.
 *
 * The landlord profile passes nothing and gets bars. The listing page passes the heading and the
 * two numbers its own server read has, so the heading and the score are in the server HTML even
 * while the area waits for the browser.
 */
export function ReviewsZoneSkeleton({
  heading,
  reviewCount,
  ratingAverage,
}: ReviewsZoneSkeletonProps) {
  const hasScore = reviewCount !== undefined && ratingAverage !== undefined;
  return (
    <Card aria-busy="true">
      <CardHeader className="border-b">
        {heading === undefined ? (
          <Skeleton className="h-5 w-24" aria-hidden="true" />
        ) : (
          <h2 className="text-base">{heading}</h2>
        )}
        {hasScore ? (
          <p className="text-sm text-muted-foreground">
            <RatingLine
              reviewCount={reviewCount}
              ratingAverage={ratingAverage}
            />
          </p>
        ) : (
          <Skeleton className="h-4 w-32" aria-hidden="true" />
        )}
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
