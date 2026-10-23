import { AuthShell } from "@/components/shells/auth-shell";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AuthShell>{children}</AuthShell>;
}
