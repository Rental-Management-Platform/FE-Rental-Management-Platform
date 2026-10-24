import { InboxIcon, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  /** A button or link, chosen by the feature that shows this state. */
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}

// Nothing to show yet, or nothing matched a search. The copy always comes from the feature.
// On the canvas it is a white box with a dashed border, so the icon tile (`muted`, the canvas
// color) still shows. Inside a zone the zone is the frame, so the border goes (spec 0004).
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = InboxIcon,
  className,
}: EmptyStateProps) {
  return (
    <Empty className={cn("bg-card in-data-[slot=card]:border-0", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
