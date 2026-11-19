import { useId, type ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsZoneProps {
  /** The `h2` of the zone. */
  title: string;
  /** A link or button at the right of the heading. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A zone of a statistics screen: a `Card` on the canvas with a hairline under its `h2` (spec 0004
 * and 0024, AC-18), named by that heading. A card never sits inside another card, so a zone holds
 * rows, text and tables, not more cards.
 */
export function StatsZone({
  title,
  action,
  children,
  className,
}: StatsZoneProps) {
  const titleId = useId();
  return (
    <Card role="group" aria-labelledby={titleId} className={className}>
      <CardHeader className="border-b">
        <CardTitle>
          <h2 id={titleId} className="text-base">
            {title}
          </h2>
        </CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={cn("gap-4")}>{children}</CardContent>
    </Card>
  );
}
