"use client";

import { House, HousePlus } from "lucide-react";
import { toast } from "sonner";
import type { Tool } from "@/components/shells/workspace-tools";
import { ToolCardView } from "@/features/dashboard/components/tool-card";
import type { StatState } from "@/features/dashboard/hooks/use-stat";
import { createApiError, networkError } from "@/lib/api/errors";
import { Labeled, Section } from "./section";

// Fake tools and fake numbers: the card is drawn from a `StatState` and never reads the
// network here (spec 0008, AC-16). The ready tool points at a page that exists.
const READY: Tool = {
  id: "demo.ready",
  group: "Mẫu",
  label: "Thêm nhà trọ",
  description: "Nhập tên, địa chỉ và phường hoặc xã của nhà trọ.",
  icon: HousePlus,
  status: "ready",
  href: "/landlord/properties/new",
};

const SOON: Tool = {
  id: "demo.soon",
  group: "Mẫu",
  label: "Nhà trọ của tôi",
  description: "Xem, sửa và xóa các nhà trọ bạn đã tạo.",
  icon: House,
  status: "soon",
};

const NONE: StatState = { kind: "none" };
const LINES: StatState = { kind: "lines", lines: ["Đã có 3 nhà trọ"] };
const TWO_LINES: StatState = {
  kind: "lines",
  lines: ["42 tài khoản", "2 đang bị khóa"],
};

// Made once, outside the component: the countdown is keyed on the identity of the error object,
// so a new object on every render would start the count again each time.
const SERVER_ERROR: StatState = {
  kind: "error",
  error: createApiError({
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
    requestId: "7f3a2c91-4b1e",
  }),
};
const NETWORK_ERROR: StatState = { kind: "error", error: networkError() };
const RATE_LIMITED: StatState = {
  kind: "error",
  error: createApiError({
    status: 429,
    code: "RATE_LIMITED",
    message: "Bạn thao tác quá nhanh.",
    retryAfterSeconds: 45,
    retryAfterExact: true,
  }),
};

const retry = () => toast("Đã bấm Thử lại");

// The cards of the two dashboards in every state, side by side (spec 0008, AC-16).
export function DashboardCardsSection() {
  return (
    <Section
      bare
      title="Thẻ công cụ của trang tổng quan"
      description="Thẻ của tính năng đã có là một liên kết, thẻ của tính năng chưa làm là chữ thường có nhãn “Sắp có” và chữ ẩn “(chưa dùng được)”. Con số nằm dưới mô tả, kể cả khi thẻ mờ, và lỗi chỉ nằm trong ô số."
    >
      <div className="grid gap-x-3 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
        <Labeled label="ready">
          <ToolCardView tool={READY} stat={NONE} />
        </Labeled>
        <Labeled label="ready · bắt đầu từ đây">
          <ToolCardView
            tool={READY}
            stat={{ kind: "lines", lines: ["Chưa có nhà trọ nào"] }}
            firstStep
          />
        </Labeled>
        <Labeled label="soon">
          <ToolCardView tool={SOON} stat={NONE} />
        </Labeled>
        <Labeled label="ready · có số">
          <ToolCardView tool={READY} stat={LINES} />
        </Labeled>
        <Labeled label="soon · có số">
          <ToolCardView tool={SOON} stat={TWO_LINES} />
        </Labeled>
        <Labeled label="đang tải số">
          <ToolCardView tool={READY} stat={{ kind: "loading" }} />
        </Labeled>
        <Labeled label="lỗi · mất mạng">
          <ToolCardView tool={READY} stat={NETWORK_ERROR} onRetry={retry} />
        </Labeled>
        <Labeled label="lỗi 500 · có mã hỗ trợ">
          <ToolCardView tool={SOON} stat={SERVER_ERROR} onRetry={retry} />
        </Labeled>
        <Labeled label="lỗi 429 · chờ 45 giây">
          <ToolCardView tool={READY} stat={RATE_LIMITED} onRetry={retry} />
        </Labeled>
      </div>
    </Section>
  );
}
