import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/shells/auth-shell";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Khung đăng nhập (xem trước)" };

export default function AuthShellPreview() {
  return (
    <AuthShell>
      <CardHeader>
        <CardTitle>
          <h1>Đăng nhập</h1>
        </CardTitle>
        <CardDescription>
          Xem trước khung đăng nhập. Nội dung thật của trang nằm trong thẻ này.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Thương hiệu ở trên, một thẻ rộng tối đa 24 rem ở giữa, không có thanh
          điều hướng và không có chân trang.
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="/dev/ui">Về thư viện giao diện</Link>
        </Button>
      </CardContent>
    </AuthShell>
  );
}
