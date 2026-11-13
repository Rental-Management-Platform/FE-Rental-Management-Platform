import type { Metadata } from "next";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
  robots: { index: false, follow: false },
};

// Static: the header is plain markup and the form is a client component that needs nothing from
// the address or the session. The card is the zone and its title is the page's one h1, as on
// the sign in page.
export default function ForgotPasswordPage() {
  return (
    <>
      <CardHeader>
        <CardTitle>
          <h1>Quên mật khẩu</h1>
        </CardTitle>
        <CardDescription>
          Nhập email đã đăng ký. Chúng tôi sẽ gửi liên kết để bạn đặt mật khẩu
          mới.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </>
  );
}
