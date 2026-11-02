"use client";

import { LayoutGridIcon } from "lucide-react";
import { useId } from "react";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import {
  groupTools,
  visibleTools,
  type Tool,
  type ToolGroup,
} from "@/components/shells/workspace-tools";
import { useSession } from "@/lib/session/auth-provider";
import { ToolCard } from "./tool-card";

// One group: a heading on the canvas, then a list of cards. One column below `sm`, two from
// `sm`, three from `xl`; a card fills the height of its row so a row of cards is even.
function ToolGroupSection({ group }: { group: ToolGroup }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-lg">
        {group.name}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {group.tools.map((tool) => (
          <li key={tool.id} className="min-w-0">
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
    </section>
  );
}

// The dashboard below its `PageHeader`: every tool of an area the person may see, grouped, in
// list order. A tool the person lacks the permission for is not drawn at all, not even dimmed,
// and a group with no visible tool has no heading (spec 0008, AC-6). Hiding is a convenience:
// the backend decides.
export function ToolGrid({ tools }: { tools: readonly Tool[] }) {
  const state = useSession();
  // The route gate only shows its children to a signed in person, so this is a safety net.
  if (state.status !== "user") return <LoadingState variant="cards" />;

  const visible = visibleTools(tools, state);
  if (visible.length === 0) {
    return (
      <EmptyState
        icon={LayoutGridIcon}
        title="Chưa có công cụ nào"
        description="Tài khoản của bạn chưa có quyền dùng công cụ nào. Hãy liên hệ quản trị viên."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groupTools(visible).map((group) => (
        <ToolGroupSection key={group.name} group={group} />
      ))}
    </div>
  );
}
