import { PublicShell } from "@/components/shells/public-shell";
import { RequireSession } from "@/features/auth/components/require-session";

// The account page of any signed in person inside the public frame (spec 0001 puts `/account`
// there, spec 0005 puts it behind the gate). The gate is outside the frame, like the other
// gated groups, so a guest never sees the public menu around a page that is not theirs. It
// leaves `accountType` out, so a renter, a landlord and an admin all pass.
export default function AccountLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireSession>
      <PublicShell>{children}</PublicShell>
    </RequireSession>
  );
}
