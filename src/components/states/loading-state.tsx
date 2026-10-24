import { Fragment } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type LoadingVariant = "cards" | "table" | "form";

const THREE = [0, 1, 2];
const FIVE = [0, 1, 2, 3, 4];
const FOUR = [0, 1, 2, 3];

function CardsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {THREE.map((i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border bg-card p-3"
        >
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-5 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-4 w-[90px]" />
            <Skeleton className="h-4 w-[70px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card in-data-[slot=card]:rounded-none in-data-[slot=card]:border-0">
      <div className="flex items-center gap-6 px-4 py-4">
        {FOUR.map((i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {FIVE.map((row) => (
        <Fragment key={row}>
          <Separator />
          <div className="flex items-center gap-6 px-4 py-4">
            {FOUR.map((cell) => (
              <Skeleton key={cell} className="h-4 flex-1" />
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      {THREE.map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-11 w-30 rounded-lg" />
    </div>
  );
}

// Skeleton presets for a list of cards, a table and a form. `aria-busy` marks the region as
// loading and the visually hidden text tells a screen reader why nothing is there yet.
export function LoadingState({
  variant,
  className,
}: {
  variant: LoadingVariant;
  className?: string;
}) {
  return (
    <div aria-busy="true" className={className}>
      <span role="status" className="sr-only">
        Đang tải
      </span>
      {variant === "cards" && <CardsSkeleton />}
      {variant === "table" && <TableSkeleton />}
      {variant === "form" && <FormSkeleton />}
    </div>
  );
}
