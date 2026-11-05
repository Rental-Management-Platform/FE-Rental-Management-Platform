import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// What stands in for the listing while the server reads it (spec 0010, AC-19). It keeps the shape
// of the page: a breadcrumb and title row, then a zone. `aria-busy` marks the region as loading
// and the hidden text tells a screen reader why nothing is there yet.
export function ListingDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span role="status" className="sr-only">
        Đang tải tin
      </span>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-full max-w-xl" />
        <Skeleton className="h-5 w-full max-w-sm" />
      </div>
      <Card>
        <CardContent className="gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}
