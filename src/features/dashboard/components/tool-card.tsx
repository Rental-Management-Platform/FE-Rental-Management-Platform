"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Tool } from "@/components/shells/workspace-tools";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useStat, type StatState } from "../hooks/use-stat";
import { StatSlot } from "./stat-slot";

interface ToolCardViewProps {
  tool: Tool;
  stat: StatState;
  /** Fetches the failed number again. */
  onRetry?: () => void;
}

// The icon tile: quiet when the tool is soon, teal tint when it opens.
type IconKind = "soon" | "ready";

const ICON_TILE: Record<IconKind, string> = {
  soon: "border bg-card text-muted-foreground",
  ready: "bg-accent text-accent-foreground",
};

function ToolIcon({ tool, kind }: { tool: Tool; kind: IconKind }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        ICON_TILE[kind],
      )}
    >
      <tool.icon aria-hidden="true" className="size-5" />
    </span>
  );
}

function CardBody({
  tool,
  kind,
  title,
  aside,
  stat,
  onRetry,
}: {
  tool: Tool;
  kind: IconKind;
  title: ReactNode;
  aside?: ReactNode;
  stat: StatState;
  onRetry: () => void;
}) {
  return (
    <CardContent className="flex-1 flex-row items-start gap-3">
      <ToolIcon tool={tool} kind={kind} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-base">{title}</h3>
          {aside}
        </div>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
        <StatSlot state={stat} onRetry={onRetry} />
      </div>
    </CardContent>
  );
}

const NO_RETRY = () => undefined;

// An item card on the canvas (spec 0004), in two kinds (spec 0008, AC-3 and AC-4). A ready tool
// is a link and the whole card is clickable: the label is the link text and a stretched link
// covers the card. A tool that is soon is plain text, not a link and not a tab stop, and its
// state is said in words (a badge and a hidden "(chưa dùng được)"), never by dimming alone.
export function ToolCardView({
  tool,
  stat,
  onRetry = NO_RETRY,
}: ToolCardViewProps) {
  if (tool.status === "soon") {
    return (
      <Card className="h-full border-dashed bg-transparent text-muted-foreground">
        <CardBody
          tool={tool}
          kind="soon"
          title={
            <>
              {tool.label}
              <span className="sr-only"> (chưa dùng được)</span>
            </>
          }
          aside={
            <Badge variant="outline" className="shrink-0">
              Sắp có
            </Badge>
          }
          stat={stat}
          onRetry={onRetry}
        />
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "relative h-full transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2",
      )}
    >
      <CardBody
        tool={tool}
        kind="ready"
        title={
          <Link
            href={tool.href}
            className="outline-hidden after:absolute after:inset-0 hover:underline"
          >
            {tool.label}
          </Link>
        }
        stat={stat}
        onRetry={onRetry}
      />
    </Card>
  );
}

// The card that reads its own number.
export function ToolCard({ tool }: { tool: Tool }) {
  const { state, retry } = useStat(tool.stat);
  return <ToolCardView tool={tool} stat={state} onRetry={retry} />;
}
