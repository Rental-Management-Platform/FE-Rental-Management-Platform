import { PublicShell } from "@/components/shells/public-shell";
import { RequireSession } from "@/features/auth/components/require-session";

// The pages of a signed in renter inside the public frame (spec 0012, AC-1). The gate is outside
// the frame, like the landlord and admin groups, so a guest or a person of another account type
// never sees the public menu around a page that is not theirs. Only the gate draws for them.
export default function TenantLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireSession accountType="tenant">
      <PublicShell>{children}</PublicShell>
    </RequireSession>
  );
}
