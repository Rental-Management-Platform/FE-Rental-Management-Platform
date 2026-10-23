import type { Metadata } from "next";
import { WorkspacePreview } from "./workspace-preview";

export const metadata: Metadata = { title: "Khung khu làm việc (xem trước)" };

export default function WorkspaceShellPreviewPage() {
  return <WorkspacePreview />;
}
