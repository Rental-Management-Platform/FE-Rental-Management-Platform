import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Bubbles of different widths and sides, so the skeleton reads as a conversation. Fixed, so the
// server HTML and the first browser render match.
const BUBBLES = [
  { id: 0, side: "items-start", width: "w-2/3" },
  { id: 1, side: "items-end", width: "w-1/2" },
  { id: 2, side: "items-start", width: "w-3/5" },
] as const;

/**
 * The conversation page while its first reads run (spec 0012, AC-8). It has the same column as
 * the real page, so nothing jumps when the messages arrive, and it stands outside the
 * `role="log"` region, which is mounted only when the messages are in.
 */
export function ThreadSkeleton() {
  return (
    <div aria-busy="true" className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader title="Tin nhắn" />
      <span role="status" className="sr-only">
        Đang tải cuộc trò chuyện
      </span>
      <Card className="min-h-0 flex-1 gap-0 py-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="aspect-4/3 w-16 shrink-0 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
        </div>
        <Separator />
        <ul className="flex min-h-0 flex-1 flex-col justify-end gap-3 px-4 py-3">
          {BUBBLES.map((bubble) => (
            <li key={bubble.id} className={`flex flex-col ${bubble.side}`}>
              <Skeleton className={`h-10 rounded-2xl ${bubble.width}`} />
            </li>
          ))}
        </ul>
        <Separator />
        <div className="flex items-end gap-2 p-3">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 w-20 rounded-lg" />
        </div>
      </Card>
    </div>
  );
}
