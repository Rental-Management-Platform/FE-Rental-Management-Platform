"use client";

import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AuthLink } from "./auth-link";

// What the reset page shows when the link cannot be used: it has no code, or the backend said
// `RESET_TOKEN_INVALID` (wrong, expired, used, or replaced by a newer link). The reasons are not
// told apart, because the backend does not tell them apart either. A quiet notice and not an
// error alert, so a person who opens a dead link is not shouted at.
//
// `moveFocus` is for the case where the form was just replaced by this notice: the focused
// button is gone, so focus goes here and a screen reader reads it. A page that loads with a dead
// link needs no move, because nothing had focus yet.
export function ResetLinkInvalid({ moveFocus }: { moveFocus: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (moveFocus) ref.current?.focus();
  }, [moveFocus]);

  return (
    <div ref={ref} tabIndex={-1} className="flex flex-col gap-4 outline-none">
      <Alert variant="warning">
        <TriangleAlertIcon />
        <AlertTitle>Liên kết không dùng được</AlertTitle>
        <AlertDescription>
          Liên kết đặt lại mật khẩu bị thiếu, đã hết hạn, đã được dùng hoặc đã
          có liên kết mới hơn. Mỗi liên kết chỉ dùng một lần và hết hạn sau 30
          phút.
        </AlertDescription>
      </Alert>
      <Button asChild size="lg">
        <Link href="/forgot-password">Xin liên kết mới</Link>
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <AuthLink href="/login">Quay lại đăng nhập</AuthLink>
      </p>
    </div>
  );
}
