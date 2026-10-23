import type { Metadata } from "next";
import { AdminUsersScreen } from "./admin-users-screen";

export const metadata: Metadata = { title: "Người dùng (màn hình mẫu)" };

export default function AdminUsersScreenPage() {
  return <AdminUsersScreen />;
}
