import { LoadingState } from "@/components/states/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const FACTS = [0, 1, 2, 3];

/**
 * What the profile page shows while the server reads the landlord: the breadcrumb, the name and
 * the score line, the numbers zone and the cards of the listings. It has the shape of the page, so
 * nothing jumps when the real content arrives. The cards part says "Đang tải" for a screen reader.
 */
export function LandlordProfileSkeleton() {
  return (
    <>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Card aria-hidden="true">
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {FACTS.map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Skeleton aria-hidden="true" className="h-6 w-40" />
      <LoadingState variant="cards" />
    </>
  );
}
