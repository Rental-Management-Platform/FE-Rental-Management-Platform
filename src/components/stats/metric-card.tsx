import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChangeNoteView } from "./change-note";
import type { ChangeNote } from "./describe-change";

interface MetricCardProps {
  /** What the number counts: "Lượt xem". */
  label: string;
  /** The number, already formatted. */
  value: string;
  /** How it changed against the period before, or `null` for a number with no period before. */
  change: ChangeNote | null;
  /** Quiet lines under the number: "Kỳ trước: 96", the total since the start, a note. */
  lines?: readonly ReactNode[];
  className?: string;
}

/**
 * One number of a statistics screen as an item card on the canvas (spec 0004): the label, the
 * value, how it changed, and a few quiet lines. It knows nothing about a landlord or an admin, so
 * the admin overview and the revenue page can use it as it is (spec 0024).
 */
export function MetricCard({
  label,
  value,
  change,
  lines = [],
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold text-card-foreground">{value}</p>
        {change !== null && <ChangeNoteView note={change} />}
        {lines.map((line, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            {line}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}
