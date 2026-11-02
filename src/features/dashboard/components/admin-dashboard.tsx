"use client";

import { ADMIN_TOOLS } from "@/components/shells/workspace-tools";
import { ToolGrid } from "./tool-grid";

// A client component, because the tools hold icons and a server page cannot pass those as props.
export function AdminDashboard() {
  return <ToolGrid tools={ADMIN_TOOLS} />;
}
