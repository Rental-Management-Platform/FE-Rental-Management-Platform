"use client";

import { SettingsIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AccountMenuView } from "@/components/shells/account-menu-view";
import type { NavItem } from "@/components/shells/nav-config";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/api/types";
import type { SessionState } from "@/lib/session/create-session";
import { Labeled, Section } from "./section";

const SAMPLE_USER: User = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "nhung.nguyen@example.com",
  name: "Nguyễn Thị Hồng Nhung",
  accountType: "landlord",
  phone: null,
  status: "active",
};

// The real `ACCOUNT_LINKS` are empty until their pages ship, so the gallery passes its own.
const SAMPLE_LINKS: readonly NavItem[] = [
  { label: "Khu chủ trọ", href: "/dev/ui/shells/workspace", icon: UserIcon },
  { label: "Tài khoản", href: "/dev/ui", icon: SettingsIcon },
];

const STATES: readonly { label: string; state: SessionState }[] = [
  { label: "loading", state: { status: "loading" } },
  { label: "guest", state: { status: "guest", endedReason: null } },
  {
    label: "không kiểm tra được",
    state: { status: "guest", endedReason: "unavailable" },
  },
  {
    label: "user",
    state: { status: "user", user: SAMPLE_USER, permissions: [] },
  },
];

const PREVIEWS = [
  {
    href: "/dev/ui/shells/public",
    label: "Khung công khai",
    note: "Đầu trang, menu điện thoại, chân trang, liên kết bỏ qua",
  },
  {
    href: "/dev/ui/shells/auth",
    label: "Khung đăng nhập",
    note: "Thương hiệu và một thẻ ở giữa",
  },
  {
    href: "/dev/ui/shells/workspace",
    label: "Khung khu làm việc",
    note: "Menu bên thu gọn được, thanh trên, menu tài khoản",
  },
] as const;

const signOutDemo = () => toast("Đã bấm Đăng xuất (mẫu, chưa đăng xuất thật)");
const retryDemo = () => toast("Đã bấm Thử lại (mẫu, chưa gọi máy chủ)");

export function ShellsSection() {
  return (
    <Section
      title="Khung trang"
      description="Bốn khung bọc mọi trang sau này. Mỗi bản xem trước dùng nội dung mẫu và một danh sách điều hướng mẫu."
    >
      <div className="flex flex-wrap gap-3">
        {PREVIEWS.map((preview) => (
          <Button key={preview.href} asChild variant="outline" size="lg">
            <Link href={preview.href} title={preview.note}>
              {preview.label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
        {STATES.map(({ label, state }) => (
          <Labeled key={label} label={`Khu vực tài khoản · ${label}`}>
            <div className="flex min-h-20 items-center rounded-lg border p-4">
              <AccountMenuView
                state={state}
                links={SAMPLE_LINKS}
                onSignOut={signOutDemo}
                onRetry={retryDemo}
              />
            </div>
          </Labeled>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
        {STATES.map(({ label, state }) => (
          <Labeled key={label} label={`Trong menu điện thoại · ${label}`}>
            <div className="rounded-lg border p-4">
              <AccountMenuView
                state={state}
                variant="list"
                links={SAMPLE_LINKS}
                onSignOut={signOutDemo}
                onRetry={retryDemo}
              />
            </div>
          </Labeled>
        ))}
      </div>
    </Section>
  );
}
