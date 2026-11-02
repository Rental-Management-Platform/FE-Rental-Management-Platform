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
}

function ToolIcon({ tool, soon }: { tool: Tool; soon: boolean }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        soon
          ? "border bg-card text-muted-foreground"
          : "bg-accent text-accent-foreground",
      )}
    >
      <tool.icon aria-hidden="true" className="size-5" />
    </span>
  );
}

function CardBody({
  tool,
  soon,
  title,
  aside,
  stat,
}: {
  tool: Tool;
  soon: boolean;
  title: ReactNode;
  aside?: ReactNode;
  stat: StatState;
}) {
  return (
    <CardContent className="flex-1 flex-row items-start gap-3">
      <ToolIcon tool={tool} soon={soon} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-base">{title}</h3>
          {aside}
        </div>
        <p className="text-sm">{tool.description}</p>
        <StatSlot state={stat} />
      </div>
    </CardContent>
  );
}

// An item card on the canvas (spec 0004), in two kinds (spec 0008, AC-3 and AC-4). A ready tool
// is a link and the whole card is clickable: the label is the link text and a stretched link
// covers the card. A tool that is soon is plain text, not a link and not a tab stop, and its
// state is said in words (a badge and a hidden "(chưa dùng được)"), never by dimming alone.
export function ToolCardView({ tool, stat }: ToolCardViewProps) {
  if (tool.status === "soon") {
    return (
      <Card className="h-full border-dashed bg-transparent text-muted-foreground">
        <CardBody
          tool={tool}
          soon
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
        />
      </Card>
    );
  }

  return (
    <Card className="relative h-full transition-shadow hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2">
      <CardBody
        tool={tool}
        soon={false}
        title={
          <Link
            href={tool.href}
            className="outline-hidden after:absolute after:inset-0 hover:underline"
          >
            {tool.label}
          </Link>
        }
        stat={stat}
      />
    </Card>
  );
}

// The card that reads its own number.
export function ToolCard({ tool }: { tool: Tool }) {
  const { state } = useStat(tool.stat);
  return <ToolCardView tool={tool} stat={state} />;
}
