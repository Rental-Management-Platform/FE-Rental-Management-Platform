import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
 * The conversation page while its first reads run (spec 0012, AC-8). It stands outside the
 * `role="log"` region, which is mounted only when the messages are in.
 */
export function ThreadSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <PageHeader title="Tin nhắn" />
      <span role="status" className="sr-only">
        Đang tải cuộc trò chuyện
      </span>
      <Card>
        <CardContent>
          <ul className="flex min-h-40 flex-col gap-3">
            {BUBBLES.map((bubble) => (
              <li key={bubble.id} className={`flex flex-col ${bubble.side}`}>
                <Skeleton className={`h-10 rounded-2xl ${bubble.width}`} />
              </li>
            ))}
          </ul>
        </CardContent>
        <Separator />
        <CardContent>
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-11 w-24 self-end rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
}
