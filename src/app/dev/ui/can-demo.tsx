"use client";

import { PlusIcon } from "lucide-react";
import { Can } from "@/components/can";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/session/auth-provider";
import { Labeled, Section } from "./section";

const describe = (status: ReturnType<typeof useSession>["status"]) =>
  status === "user"
    ? "đã đăng nhập"
    : status === "guest"
      ? "khách"
      : "đang tải";

// `Can` reads the real session of this browser, so sign in as a landlord and as a seeker (on
// `/login`) and come back to see the same control appear and disappear.
export function CanDemo() {
  const state = useSession();

  return (
    <Section
      title="Quyền (Can)"
      description={`Chỉ ẩn, không bao giờ làm mờ. Đọc quyền của phiên thật trong trình duyệt này, hiện là: ${describe(state.status)}. Đăng nhập bằng chủ trọ rồi bằng người tìm trọ để thấy khác nhau.`}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Labeled label='permission="listing:create" (chủ trọ có)'>
          <div className="flex min-h-11 items-center">
            <Can
              permission="listing:create"
              loading={<Skeleton className="h-11 w-32" />}
              fallback={
                <p className="text-sm text-muted-foreground">
                  Nút đăng tin bị ẩn vì bạn không có quyền này.
                </p>
              }
            >
              <Button size="lg">
                <PlusIcon data-icon="inline-start" />
                Đăng tin
              </Button>
            </Can>
          </div>
        </Labeled>
        <Labeled label='permission="favorite:manage" (người tìm trọ có)'>
          <div className="flex min-h-11 items-center">
            <Can
              permission="favorite:manage"
              loading={<Skeleton className="h-11 w-32" />}
              fallback={
                <p className="text-sm text-muted-foreground">
                  Nút lưu tin bị ẩn vì bạn không có quyền này.
                </p>
              }
            >
              <Button size="lg" variant="outline">
                Lưu tin
              </Button>
            </Can>
          </div>
        </Labeled>
      </div>
    </Section>
  );
}
