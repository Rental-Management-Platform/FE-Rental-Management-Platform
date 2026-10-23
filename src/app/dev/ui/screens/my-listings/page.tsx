import type { Metadata } from "next";
import { MyListingsScreen } from "./my-listings-screen";

export const metadata: Metadata = { title: "Tin của tôi (màn hình mẫu)" };

export default function MyListingsScreenPage() {
  return <MyListingsScreen />;
}
