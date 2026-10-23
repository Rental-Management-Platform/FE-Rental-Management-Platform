import type { Metadata } from "next";
import { PublicShell } from "@/components/shells/public-shell";
import { PUBLIC_SCREENS_NAV } from "../screens";
import { ListingsScreen } from "./listings-screen";

export const metadata: Metadata = { title: "Danh sách tin (màn hình mẫu)" };

export default function ListingsScreenPage() {
  return (
    <PublicShell nav={PUBLIC_SCREENS_NAV}>
      <ListingsScreen />
    </PublicShell>
  );
}
