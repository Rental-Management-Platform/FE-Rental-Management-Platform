import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/states/loading-state";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Đăng ký",
  robots: { index: false, follow: false },
};

// Static, like the sign in page: the form reads `?next=` and the session in the browser,
// behind a <Suspense> whose fallback is the form skeleton.
export default function RegisterPage() {
  return (
    <>
      <CardHeader>
        <CardTitle>
          <h1>Đăng ký</h1>
        </CardTitle>
        <CardDescription>Chọn loại tài khoản bạn cần.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoadingState variant="form" fields={2} />}>
          <RegisterForm />
        </Suspense>
      </CardContent>
    </>
  );
}
