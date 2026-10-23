import { AdminShell } from "@/components/shells/workspace-shells";

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return <AdminShell>{children}</AdminShell>;
}
