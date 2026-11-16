import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CARDS = [0, 1, 2];

/**
 * What the page shows while the server reads the plans: three cards with the shape of a real one
 * (name, price, three points, the 44 px button), so nothing jumps when the plans arrive. A screen
 * reader hears one "Đang tải" and not the boxes.
 */
export function PlansSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải bảng giá
      </span>
      <ul aria-hidden="true" className="grid gap-6 md:grid-cols-3">
        {CARDS.map((i) => (
          <li key={i} className="grid">
            <Card>
              <CardHeader>
                <Skeleton className="h-7 w-32" />
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Skeleton className="h-9 w-44" />
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-56 max-w-full" />
                </div>
              </CardContent>
              <CardFooter className="mt-auto">
                <Skeleton className="h-11 w-full" />
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
