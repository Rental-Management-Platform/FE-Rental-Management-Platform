import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// The loading state of the order page, drawn in the shape of the page it is waiting for: two
// zones side by side from `lg`, each with a title row and a few lines. `aria-busy` marks the
// region as loading and the hidden text tells a screen reader why nothing is there yet.
export function OrderSkeleton() {
  return (
    <div aria-busy="true" className="grid items-start gap-6 lg:grid-cols-2">
      <span role="status" className="sr-only">
        Đang tải
      </span>
      <Card>
        <CardHeader className="border-b">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="gap-5">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="gap-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-11 w-40 rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
