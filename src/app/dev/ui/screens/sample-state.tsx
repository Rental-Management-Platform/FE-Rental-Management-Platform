"use client";

import { useState, type ReactNode } from "react";
import { ErrorState } from "@/components/states/error-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createApiError, type ApiError } from "@/lib/api/errors";
import { useCountdown } from "@/lib/use-countdown";
import { cn } from "@/lib/utils";

// What a list can be showing. The list and the users table share these five.
export type SampleState =
  "data" | "empty" | "loading" | "error" | "rate-limited";

const STATE_OPTIONS: readonly { value: SampleState; label: string }[] = [
  { value: "data", label: "Có dữ liệu" },
  { value: "empty", label: "Trống" },
  { value: "loading", label: "Đang tải" },
  { value: "error", label: "Lỗi máy chủ" },
  { value: "rate-limited", label: "Bị giới hạn tần suất" },
];

// Made once, outside any component: ErrorState and the countdown key on the identity of the
// error object, so a new object on every render would restart them.
const SERVER_ERROR = createApiError({
  status: 500,
  code: "INTERNAL_ERROR",
  message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
  requestId: "7f3a2c91-4b1e",
});

const makeRateLimit = () =>
  createApiError({
    status: 429,
    code: "RATE_LIMITED",
    message: "Bạn thao tác quá nhanh.",
    retryAfterSeconds: 30,
    retryAfterExact: true,
  });

/** The state the sample screen shows, and a fresh 429 each time that state is picked. */
export function useSampleState() {
  const [state, setState] = useState<SampleState>("data");
  const [rateLimit, setRateLimit] = useState(makeRateLimit);

  const select = (next: SampleState) => {
    if (next === "rate-limited") setRateLimit(makeRateLimit());
    setState(next);
  };
  return { state, select, reset: () => setState("data"), rateLimit };
}

/** A row of toggle buttons. `aria-pressed` tells a screen reader which one is on. */
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-2"
    >
      <span aria-hidden="true" className="text-sm font-medium">
        {label}
      </span>
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={value === option.value ? "default" : "outline"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function StateChoice({
  state,
  onChange,
}: {
  state: SampleState;
  onChange: (state: SampleState) => void;
}) {
  return (
    <ChoiceGroup
      label="Trạng thái"
      options={STATE_OPTIONS}
      value={state}
      onChange={onChange}
    />
  );
}

/** The strip above a sample screen that holds the switches. It is not part of the screen. */
export function SampleControls({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Điều khiển cho trang mẫu"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-dashed bg-muted p-3 md:flex-row md:flex-wrap md:items-center md:gap-x-6",
        className,
      )}
    >
      <Badge variant="outline" className="self-start">
        Chỉ có ở trang mẫu
      </Badge>
      {children}
    </div>
  );
}

function RateLimitedPanel({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  return (
    <div className="flex flex-col items-start gap-4">
      <RateLimitNotice error={error} className="w-full" />
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onRetry}
        disabled={secondsLeft > 0}
      >
        Thử lại
      </Button>
    </div>
  );
}

/**
 * Picks what a list area shows for a state. `children` is the populated view; the caller
 * passes its own loading and empty views because their copy and shape differ.
 */
export function StateSwitch({
  state,
  loading,
  empty,
  rateLimit,
  onRetry,
  children,
}: {
  state: SampleState;
  loading: ReactNode;
  empty: ReactNode;
  rateLimit: ApiError;
  onRetry: () => void;
  children: ReactNode;
}) {
  switch (state) {
    case "empty":
      return empty;
    case "loading":
      return loading;
    case "error":
      return <ErrorState error={SERVER_ERROR} onRetry={onRetry} />;
    case "rate-limited":
      return <RateLimitedPanel error={rateLimit} onRetry={onRetry} />;
    case "data":
      return children;
  }
}
