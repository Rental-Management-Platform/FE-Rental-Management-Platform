"use client";

import { WorkspaceShell } from "@/components/shells/workspace-shell";
import { PreviewContent } from "../preview-content";
import { SAMPLE_NAV } from "../sample-nav";

// A client component, because the sample items hold icons and cannot be passed from a server
// page as props.
export function WorkspacePreview() {
  return (
    <WorkspaceShell title="Khu làm việc (xem trước)" items={SAMPLE_NAV}>
      <PreviewContent title="Khung khu làm việc" />
    </WorkspaceShell>
  );
}
