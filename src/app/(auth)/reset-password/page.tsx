import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/states/loading-state";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

// The address holds a one time code until the form has read it, so the page asks the browser to
// send no `Referer` header at all (api-for-frontend.md, section 7).
export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// Static: the header is plain markup, and the form reads `?token=` in the browser behind a
// <Suspense> whose fallback is the form skeleton, as the sign in page does. The path is fixed
// because the email links straight to it.
export default function ResetPasswordPage() {
  return (
    <>
      <CardHeader>
        <CardTitle>
          <h1>Đặt lại mật khẩu</h1>
        </CardTitle>
        <CardDescription>
          Nhập mật khẩu mới cho tài khoản của bạn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoadingState variant="form" fields={1} />}>
          <ResetPasswordForm />
        </Suspense>
      </CardContent>
    </>
  );
}
