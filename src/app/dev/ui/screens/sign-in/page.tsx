import type { Metadata } from "next";
import { AuthShell } from "@/components/shells/auth-shell";
import { SignInScreen } from "./sign-in-screen";

export const metadata: Metadata = { title: "Đăng nhập (màn hình mẫu)" };

export default function SignInScreenPage() {
  return (
    <AuthShell>
      <SignInScreen />
    </AuthShell>
  );
}
