"use client";

import { SearchXIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { ImagePlaceholder } from "@/components/states/image-placeholder";
import { LoadingState } from "@/components/states/loading-state";
import { NotFoundState } from "@/components/states/not-found-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { createApiError, networkError } from "@/lib/api/errors";
import { Labeled, Section } from "./section";

// Made once, outside the component: the countdown and the retry are keyed on the identity of
// the error object, so a new object on every render would start the count again each time.
const SERVER_ERROR = createApiError({
  status: 500,
  code: "INTERNAL_ERROR",
  message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
  requestId: "7f3a2c91-4b1e",
});
// The same requestId, but a 4xx answer: ErrorState must not show it.
const NOT_FOUND_ERROR = createApiError({
  status: 404,
  code: "NOT_FOUND",
  message: "Không tìm thấy tin đăng này.",
  requestId: "7f3a2c91-4b1e",
});
const NETWORK_ERROR = networkError();

const rateLimited = (seconds: number, exact: boolean) =>
  createApiError({
    status: 429,
    code: "RATE_LIMITED",
    message: "Bạn thao tác quá nhanh.",
    retryAfterSeconds: seconds,
    retryAfterExact: exact,
  });

const makeRateLimits = () => ({
  approximate: rateLimited(900, false),
  exact: rateLimited(45, true),
});

function RateLimitDemo() {
  const [errors, setErrors] = useState(makeRateLimits);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-6 md:grid-cols-2">
        <Labeled label="retryAfterExact: false · có chữ “khoảng”">
          <RateLimitNotice error={errors.approximate} />
        </Labeled>
        <Labeled label="retryAfterExact: true · đếm ngược từng giây">
          <RateLimitNotice error={errors.exact} />
        </Labeled>
      </div>
      <div>
        <Button variant="outline" onClick={() => setErrors(makeRateLimits())}>
          Đếm lại từ đầu
        </Button>
      </div>
    </div>
  );
}

// The six shared states from spec 0003, plus the image placeholder, side by side.
export function StatesSection() {
  const retry = () => toast("Đã bấm Thử lại");

  return (
    <>
      <Section
        title="Trạng thái trống"
        description="Lời văn do từng tính năng viết, hai dòng dưới đây chỉ là ví dụ."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState
            title="Chưa có tin đăng nào"
            description="Khi bạn đăng tin, tin sẽ hiện ở đây."
            action={<Button size="lg">Đăng tin mới</Button>}
          />
          <EmptyState
            icon={SearchXIcon}
            title="Không có tin nào phù hợp"
            description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc."
          />
        </div>
      </Section>

      <Section
        title="Đang tải"
        description="Ba khung chờ dựng sẵn. Người dùng đọc màn hình nghe “Đang tải”."
      >
        <div className="flex flex-col gap-8">
          <Labeled label='variant="cards"'>
            <LoadingState variant="cards" />
          </Labeled>
          <Labeled label='variant="table"'>
            <LoadingState variant="table" />
          </Labeled>
          <Labeled label='variant="form"'>
            <LoadingState variant="form" />
          </Labeled>
        </div>
      </Section>

      <Section
        title="Lỗi"
        description="Mã hỗ trợ chỉ hiện khi máy chủ trả lỗi 5xx. Lỗi 404 cùng requestId thì không hiện."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <Labeled label="500 · có mã hỗ trợ">
            <ErrorState error={SERVER_ERROR} onRetry={retry} />
          </Labeled>
          <Labeled label="404 · không có mã hỗ trợ">
            <ErrorState error={NOT_FOUND_ERROR} onRetry={retry} />
          </Labeled>
          <Labeled label="Mất mạng">
            <ErrorState error={NETWORK_ERROR} onRetry={retry} />
          </Labeled>
        </div>
      </Section>

      <Section
        title="Bị giới hạn tần suất"
        description="Chờ đến khi hết thì thông báo đổi sang “Bạn có thể thử lại ngay.”"
      >
        <RateLimitDemo />
      </Section>

      <Section title="Không tìm thấy và không có quyền">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border">
            <NotFoundState />
          </div>
          <div className="rounded-xl border">
            <ForbiddenState />
          </div>
        </div>
      </Section>

      <Section
        title="Chưa có ảnh"
        description="Hiện khi tin đăng không có ảnh bìa (coverImageUrl là null)."
      >
        <div className="flex flex-wrap items-start gap-6">
          <Labeled label='ratio="4:3"'>
            <div className="w-48">
              <ImagePlaceholder ratio="4:3" />
            </div>
          </Labeled>
          <Labeled label='ratio="16:9"'>
            <div className="w-48">
              <ImagePlaceholder ratio="16:9" />
            </div>
          </Labeled>
          <Labeled label='ratio="1:1"'>
            <div className="w-48">
              <ImagePlaceholder ratio="1:1" />
            </div>
          </Labeled>
        </div>
      </Section>
    </>
  );
}
