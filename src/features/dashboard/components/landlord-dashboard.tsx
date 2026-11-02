"use client";

import { LANDLORD_TOOLS } from "@/components/shells/workspace-tools";
import { ToolGrid } from "./tool-grid";

// A client component, because the tools hold icons and a server page cannot pass those as props.
export function LandlordDashboard() {
  return <ToolGrid tools={LANDLORD_TOOLS} />;
}
