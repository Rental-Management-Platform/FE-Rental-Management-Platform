import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/states/loading-state";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: false },
};

// Static: the header is plain markup and the form reads `?next=` and the session in the
// browser, behind a <Suspense> whose fallback is the form skeleton. The card is the zone and its
// title is the page's one h1, so there is no PageHeader (design.md, "Composition patterns").
export default function LoginPage() {
  return (
    <>
      <CardHeader>
        <CardTitle>
          <h1>Đăng nhập</h1>
        </CardTitle>
        <CardDescription>
          Dùng email và mật khẩu đã đăng ký để đăng tin, lưu tin yêu thích và
          theo dõi chủ trọ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoadingState variant="form" fields={2} />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </>
  );
}
