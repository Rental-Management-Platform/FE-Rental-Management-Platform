import { LandlordShell } from "@/components/shells/workspace-shells";
import { RequireSession } from "@/features/auth/components/require-session";

// The gate is outside the shell, so a guest or a person of another account type never sees
// the landlord menu (spec 0005, AC-9).
export default function LandlordLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireSession accountType="landlord">
      <LandlordShell>{children}</LandlordShell>
    </RequireSession>
  );
}
