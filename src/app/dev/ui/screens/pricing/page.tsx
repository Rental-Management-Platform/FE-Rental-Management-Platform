import type { Metadata } from "next";
import { PublicShell } from "@/components/shells/public-shell";
import { PUBLIC_SCREENS_NAV } from "../screens";
import { PricingScreen } from "./pricing-screen";

export const metadata: Metadata = { title: "Bảng giá gói (màn hình mẫu)" };

export default function PricingScreenPage() {
  return (
    <PublicShell nav={PUBLIC_SCREENS_NAV}>
      <PricingScreen />
    </PublicShell>
  );
}
