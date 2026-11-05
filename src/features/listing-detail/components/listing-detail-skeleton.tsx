import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// What stands in for the listing while the server reads it (spec 0010, AC-19). It reserves the
// same boxes as the page (a 4:3 photo box, the title, the facts, the contact card on the right
// from `lg`, the description), so nothing jumps when the content arrives. `aria-busy` marks the
// region as loading and the hidden text tells a screen reader why nothing is there yet.
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="aspect-4/3 w-full rounded-xl lg:col-start-1" />

        <Card className="lg:col-start-1">
          <CardContent className="gap-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:self-start">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-11 w-full rounded-lg" />
          </CardContent>
        </Card>

        <Card className="lg:col-start-1">
          <CardContent className="gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
