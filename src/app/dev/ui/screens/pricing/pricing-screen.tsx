"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccountType } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { PLANS } from "../sample-data";
import { ChoiceGroup, SampleControls } from "../sample-state";
import { SCREENS_HOME } from "../screens";

type Viewer = "guest" | AccountType;

const VIEWERS: readonly { value: Viewer; label: string }[] = [
  { value: "guest", label: "Khách" },
  { value: "landlord", label: "Chủ trọ" },
  { value: "tenant", label: "Người tìm trọ" },
  { value: "admin", label: "Admin" },
];

const SIGN_IN_HREF = `${SCREENS_HOME}/sign-in`;

const GOOD_TO_KNOW = [
  {
    title: "Dùng thử trước",
    text: "Chủ trọ mới có một kỳ dùng thử với số tin giới hạn. Hết kỳ mà chưa có gói thì tin biến khỏi trang tìm trọ.",
  },
  {
    title: "Gói thay hạn mức dùng thử",
    text: "Gói đang chạy thay hạn mức dùng thử. Tin bị ẩn bớt vì vượt hạn mức hiện lại ngay khi thanh toán xong.",
  },
  {
    title: "Gia hạn không mất ngày nào",
    text: "Mua khi gói còn hạn thì kỳ mới nối vào cuối kỳ hiện tại.",
  },
] as const;

// Public screen: one item card per plan from `GET /plans`, cheapest first as the API sorts them,
// standing on the canvas, then one white zone with what to know before buying. Who
// sees the buy button is fixed by the sample viewer here (the real rule is the scope's item on
// the pricing page): a landlord buys, a guest is led to sign in, a seeker and an admin see none.
export function PricingScreen() {
  const [viewer, setViewer] = useState<Viewer>("guest");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <SampleControls>
        <ChoiceGroup
          label="Người xem"
          options={VIEWERS}
          value={viewer}
          onChange={setViewer}
        />
      </SampleControls>

      <PageHeader
        title="Bảng giá gói đăng tin"
        description="Chọn gói theo số tin bạn cần hiện cùng lúc. Giá tính cho một kỳ, và thanh toán chỉ là thanh toán thử."
      />

      <ul className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <li key={plan.id} className="grid">
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2 className="text-xl">{plan.name}</h2>
                </CardTitle>
                <CardDescription>
                  Hiện cùng lúc tối đa {plan.maxListings} tin
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <p className="text-3xl font-semibold tabular-nums">
                  {formatMoney(plan.price)}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    mỗi {plan.durationDays} ngày
                  </span>
                </p>
                <ul className="flex flex-col gap-2 text-sm">
                  <PlanPoint>
                    Tối đa {plan.maxListings} tin hiện cùng lúc
                  </PlanPoint>
                  <PlanPoint>Mỗi kỳ {plan.durationDays} ngày</PlanPoint>
                  <PlanPoint>
                    Khoảng{" "}
                    {formatMoney(Math.round(plan.price / plan.maxListings))} mỗi
                    tin trong một kỳ
                  </PlanPoint>
                  <PlanPoint>
                    Tin hiện lại với khách ngay khi thanh toán xong
                  </PlanPoint>
                </ul>
              </CardContent>
              {(viewer === "guest" || viewer === "landlord") && (
                <CardFooter className="mt-auto">
                  {viewer === "landlord" ? (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() =>
                        toast(
                          `Đã chọn gói ${plan.name}. Bản mẫu dừng ở đây, bước xác nhận đơn do tính năng mua gói làm.`,
                        )
                      }
                    >
                      Mua gói {plan.name}
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="w-full"
                    >
                      <Link href={SIGN_IN_HREF}>Đăng nhập để mua</Link>
                    </Button>
                  )}
                </CardFooter>
              )}
            </Card>
          </li>
        ))}
      </ul>

      {(viewer === "tenant" || viewer === "admin") && (
        <p className="text-sm text-muted-foreground">
          Chỉ chủ trọ mới mua được gói, nên tài khoản này không có nút mua.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="text-base">Cần biết trước khi mua</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-4 md:grid-cols-3">
            {GOOD_TO_KNOW.map(({ title, text }) => (
              <li key={title} className="flex flex-col gap-1">
                <h3 className="text-base">{title}</h3>
                <p className="text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanPoint({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckIcon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-primary"
      />
      <span>{children}</span>
    </li>
  );
}
