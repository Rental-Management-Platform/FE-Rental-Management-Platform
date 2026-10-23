import type { Metadata } from "next";
import { PublicShell } from "@/components/shells/public-shell";
import { PUBLIC_SCREENS_NAV } from "../screens";
import { ListingDetailScreen } from "./listing-detail-screen";

export const metadata: Metadata = { title: "Chi tiết tin (màn hình mẫu)" };

export default function ListingDetailScreenPage() {
  return (
    <PublicShell nav={PUBLIC_SCREENS_NAV}>
      <ListingDetailScreen />
    </PublicShell>
  );
}
