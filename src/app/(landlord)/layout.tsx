import { LandlordShell } from "@/components/shells/workspace-shells";

export default function LandlordLayout({ children }: LayoutProps<"/">) {
  return <LandlordShell>{children}</LandlordShell>;
}
