"use client";

import type { ReactNode } from "react";
import { ADMIN_NAV, LANDLORD_HOME, LANDLORD_NAV } from "./nav-config";
import { WorkspaceShell } from "./workspace-shell";

// Client components, because the nav arrays hold icons and a server layout cannot pass those
// as props. The layouts of `(landlord)` and `(admin)` render these. "Tổng quan" is the current
// item on the address of the dashboard only (spec 0008, AC-12).
export function LandlordShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShell
      title="Khu chủ trọ"
      items={LANDLORD_NAV}
      exactHrefs={[LANDLORD_HOME]}
    >
      {children}
    </WorkspaceShell>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShell title="Quản trị" items={ADMIN_NAV}>
      {children}
    </WorkspaceShell>
  );
}
