"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { describeError } from "@/lib/api/errors";
import { useSession, useSessionActions } from "@/lib/session/auth-provider";

// A fixture for the route gate, for developers only (the pages that use it answer 404 in a
// production build). Items #12 and #20 delete it once a real gated page exists. Its button makes
// a call that needs a login (`reload`), so a session that ended in another tab is noticed here
// and the gate can be seen sending the person to sign in.
export function GateCheck({ area }: { area: string }) {
  const state = useSession();
  const { reload } = useSessionActions();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const check = async () => {
    setChecking(true);
    setResult(null);
    try {
      await reload();
      setResult("Phiên còn hiệu lực: máy chủ đã trả lời lệnh cần đăng nhập.");
    } catch (error) {
      setResult(describeError(error).message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Trang thử của cổng · {area}</CardTitle>
        <CardDescription>
          Chỉ để lập trình viên thử cổng chặn trang. Bạn thấy trang này vì cổng
          đã cho qua.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "user" && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="min-w-0 truncate">{state.user.email}</dd>
            <dt className="text-muted-foreground">Loại tài khoản</dt>
            <dd>{state.user.accountType}</dd>
            <dt className="text-muted-foreground">Số quyền</dt>
            <dd>{state.permissions.length}</dd>
          </dl>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={checking}
            aria-busy={checking}
            onClick={() => void check()}
          >
            {checking && <Spinner size="sm" />}
            Kiểm tra phiên
          </Button>
          {result && (
            <p role="status" className="text-sm text-muted-foreground">
              {result}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
