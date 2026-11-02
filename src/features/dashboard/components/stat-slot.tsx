import { Skeleton } from "@/components/ui/skeleton";
import type { StatState } from "../hooks/use-stat";

// The number of a card, below its description. It only draws a state, so `/dev/ui` can show
// every state without a network call; `ToolCard` reads the real one.
export function StatSlot({ state }: { state: StatState }) {
  switch (state.kind) {
    case "none":
      return null;
    case "loading":
      return (
        <div role="status" className="pt-1">
          <Skeleton className="h-4 w-32" />
          <span className="sr-only">Đang tải số liệu</span>
        </div>
      );
    case "error":
      return (
        <p className="pt-1 text-sm text-destructive">Không tải được số liệu</p>
      );
    case "lines":
      return (
        <ul className="flex flex-col gap-0.5 pt-1 text-sm font-medium">
          {state.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      );
  }
}
