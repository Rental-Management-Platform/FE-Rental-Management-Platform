"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createApiError, type ApiError } from "@/lib/api/errors";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { SampleControls } from "../sample-state";
import { SCREENS_HOME } from "../screens";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.2).
// The schema is built once, outside the component.
const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Nhập email của bạn.")
    .pipe(z.email("Email chưa đúng định dạng.")),
  password: z.string().min(1, "Nhập mật khẩu."),
});

type SignInValues = z.input<typeof signInSchema>;

const FIELDS: readonly Path<SignInValues>[] = ["email", "password"];

// What `POST /auth/login` can answer. No server is called: each button hands one fake error to
// the same code a real sign in uses.
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
    label: "401 · sai email hoặc mật khẩu",
    make: () =>
      createApiError({
        status: 401,
        code: "INVALID_CREDENTIALS",
        message: "Email hoặc mật khẩu không đúng.",
      }),
  },
  {
    label: "403 · tài khoản bị khóa",
    make: () =>
      createApiError({
        status: 403,
        code: "ACCOUNT_LOCKED",
        message:
          "Tài khoản của bạn đã bị khóa. Hãy liên hệ quản trị viên để được hỗ trợ.",
      }),
  },
  {
    label: "429 · chờ 15 phút",
    make: () =>
      createApiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Bạn đăng nhập sai quá nhiều lần.",
        retryAfterSeconds: 900,
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

const TEXT_LINK = cn(
  "rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline",
  FOCUS_RING,
);

const notBuilt = () => toast("Màn hình này chưa có trong bản mẫu.");

// The sign in page inside `AuthShell`: it brings the `CardHeader` and `CardContent` that the
// shell's card holds. The switches sit inside the card, under a dashed line, because the shell
// has nothing else on the page.
export function SignInScreen() {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };
  // A fresh start for each pretend answer, so the field messages of the last one go too.
  const simulate = (error: ApiError) => {
    clearFailure();
    clearErrors();
    report(error);
  };
  const onSubmit = () => {
    clearFailure();
    toast.success(
      "Đăng nhập mẫu thành công. Trang thật sẽ đưa bạn về chỗ đang xem.",
    );
  };

  return (
    <>
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl">Đăng nhập</h1>
        </CardTitle>
        <CardDescription>
          Dùng email và mật khẩu đã đăng ký để đăng tin, lưu phòng yêu thích và
          theo dõi chủ trọ.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form
          noValidate
          aria-label="Đăng nhập"
          onSubmit={handleSubmit(onSubmit, clearFailure)}
          className="flex flex-col gap-5"
        >
          <FieldGroup>
            <FormField control={control} name="email" label="Email">
              {({ field, aria }) => (
                <Input
                  type="email"
                  size="lg"
                  autoComplete="username"
                  inputMode="email"
                  placeholder="ban@example.com"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
            <FormField control={control} name="password" label="Mật khẩu">
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
          <button
            type="button"
            onClick={notBuilt}
            className={cn(TEXT_LINK, "self-end")}
          >
            Quên mật khẩu?
          </button>
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

        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <button type="button" onClick={notBuilt} className={TEXT_LINK}>
            Đăng ký
          </button>
        </p>

        <SampleControls className="md:flex-col md:items-start md:gap-3">
          <p className="text-sm font-medium">Giả lập câu trả lời của máy chủ</p>
          <div className="flex flex-wrap gap-2">
            {FAKE_ERRORS.map(({ label, make }) => (
              <Button
                key={label}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => simulate(make())}
              >
                {label}
              </Button>
            ))}
          </div>
          <Link href={SCREENS_HOME} className={cn(TEXT_LINK, "mt-1")}>
            Về danh sách màn hình mẫu
          </Link>
        </SampleControls>
      </CardContent>
    </>
  );
}
