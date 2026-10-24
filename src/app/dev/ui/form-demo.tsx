"use client";

import { useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createApiError, type ApiError } from "@/lib/api/errors";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { Section } from "./section";

interface Values {
  email: string;
  password: string;
}

const FIELDS: readonly Path<Values>[] = ["email", "password"];

// What the backend could answer to a sign in. No server is called: each button hands one fake
// error to the same code a real form uses (spec 0003, AC-6).
const FAKE_ERRORS: { label: string; make: () => ApiError }[] = [
  {
    label: "400 · hai ô lỗi",
    make: () =>
      createApiError({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Dữ liệu chưa hợp lệ.",
        errors: [
          {
            field: "email",
            code: "INVALID_EMAIL",
            message: "Email không đúng định dạng.",
          },
          {
            field: "password",
            code: "TOO_SHORT",
            message: "Mật khẩu phải có ít nhất 8 ký tự.",
          },
        ],
      }),
  },
  {
    label: "409 · EMAIL_TAKEN",
    make: () =>
      createApiError({
        status: 409,
        code: "EMAIL_TAKEN",
        message: "Email này đã được đăng ký.",
      }),
  },
  {
    label: "400 · ô lạ (thông báo chung)",
    make: () =>
      createApiError({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Dữ liệu chưa hợp lệ.",
        errors: [
          {
            field: "phone",
            code: "INVALID_PHONE",
            message: "Số điện thoại không đúng định dạng.",
          },
        ],
      }),
  },
  {
    label: "429 · chờ 15 phút",
    make: () =>
      createApiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Bạn thao tác quá nhanh.",
        retryAfterSeconds: 900,
        retryAfterExact: false,
      }),
  },
  {
    label: "429 · chờ 10 giây",
    make: () =>
      createApiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Bạn thao tác quá nhanh.",
        retryAfterSeconds: 10,
        retryAfterExact: true,
      }),
  },
  {
    label: "500 · có mã hỗ trợ",
    make: () =>
      createApiError({
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
        requestId: "7f3a2c91-4b1e",
      }),
  },
];

export function FormDemo() {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: { email: "", password: "" } });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );

  const simulate = (error: ApiError) => {
    clear();
    clearErrors();
    report(error);
  };

  const onSubmit = () => {
    clear();
    clearErrors();
    toast("Đã gửi biểu mẫu giả lập, không có máy chủ thật.");
  };

  return (
    <Section
      title="Biểu mẫu nhận lỗi từ máy chủ"
      description="Bấm một nút giả lập: mỗi lỗi nằm dưới đúng ô của nó, focus nhảy vào ô lỗi đầu tiên, lỗi 429 đếm ngược và khóa nút gửi."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          aria-label="Đăng nhập thử"
          className="flex w-full max-w-md flex-col gap-5"
        >
          <h3 className="text-xl">Đăng nhập</h3>
          <FieldGroup>
            <FormField
              control={control}
              name="email"
              label="Email"
              description="Dùng để đăng nhập và nhận thông báo."
            >
              {({ field, aria }) => (
                <Input
                  type="email"
                  size="lg"
                  autoComplete="username"
                  placeholder="Nhập email của bạn"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
            <FormField
              control={control}
              name="password"
              label="Mật khẩu"
              description="Ít nhất 8 ký tự."
            >
              {({ field, aria }) => (
                <Input
                  type="password"
                  size="lg"
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
          </FieldGroup>
          <FailureNotice
            failure={failure}
            message={errors.root?.server?.message}
          />
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || secondsLeft > 0}
          >
            Đăng nhập
          </Button>
        </form>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Giả lập câu trả lời của máy chủ</p>
          <div className="flex flex-wrap gap-3">
            {FAKE_ERRORS.map(({ label, make }) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                onClick={() => simulate(make())}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
