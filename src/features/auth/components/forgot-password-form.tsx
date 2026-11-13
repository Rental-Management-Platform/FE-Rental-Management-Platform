"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { isAbortError } from "@/lib/api/abort";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { useApi } from "@/lib/session/auth-provider";
import { requestPasswordReset } from "../api/password-recovery";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "../schemas/forgot-password-schema";
import { AuthLink } from "./auth-link";

// The form's own paths, so a message the backend sends for a field this form lacks is shown as
// the form level message and never lost.
const FIELDS: readonly Path<ForgotPasswordValues>[] = ["email"];

// The backend's sentence (api-for-frontend.md, 6.7) is shown as it came. This copy of it is for
// an answer that has no `message`, so the page never says more or less than the contract allows:
// nothing about whether the email has an account, and nothing that promises an email was sent.
const SENT_FALLBACK =
  "Nếu email này có tài khoản, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.";

// The ask for a reset link, below the `CardHeader` of its page. The same sentence appears for
// every email, so a person cannot find out which emails are registered. It works whoever is
// looking, signed in or not, because a person may open it from a browser that is signed in.
export function ForgotPasswordForm() {
  const api = useApi();
  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );
  // The sentence of the answer once a request went through; `null` while the form shows.
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const sentRef = useRef<HTMLDivElement>(null);

  // The form and its focused button are gone, so focus would fall to the page. It goes to the
  // answer instead, and a screen reader reads it.
  useEffect(() => {
    if (sentMessage !== null) sentRef.current?.focus();
  }, [sentMessage]);

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async ({ email }: ForgotPasswordValues) => {
    clearFailure();
    try {
      const answer = await requestPasswordReset(api, email);
      setSentMessage(answer.message || SENT_FALLBACK);
    } catch (error) {
      if (!isAbortError(error)) report(error);
    }
  };

  // Back to the form with the email still in the box, to send again or to fix a typo.
  const askAgain = () => {
    setSentMessage(null);
    requestAnimationFrame(() => setFocus("email"));
  };

  if (sentMessage !== null) {
    return (
      <div
        ref={sentRef}
        tabIndex={-1}
        className="flex flex-col gap-4 outline-none"
      >
        <Alert variant="info">
          <MailIcon />
          <AlertTitle>Yêu cầu đã được nhận</AlertTitle>
          <AlertDescription>{sentMessage}</AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Liên kết chỉ dùng được một lần và hết hạn sau 30 phút. Nếu bạn gửi
          lại, chỉ liên kết mới nhất còn dùng được.
        </p>
        <Button type="button" variant="outline" size="lg" onClick={askAgain}>
          Gửi lại hoặc đổi email
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <AuthLink href="/login">Quay lại đăng nhập</AuthLink>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        noValidate
        method="post"
        aria-label="Quên mật khẩu"
        onSubmit={handleSubmit(onSubmit, clearFailure)}
        className="flex flex-col gap-4"
      >
        <FieldGroup>
          <FormField
            control={control}
            name="email"
            label="Email"
            description="Email bạn đã dùng để đăng ký."
          >
            {({ field, aria }) => (
              <Input
                type="email"
                size="lg"
                autoComplete="username"
                inputMode="email"
                placeholder="Nhập email của bạn"
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
          aria-busy={isSubmitting}
        >
          {isSubmitting && <Spinner size="sm" />}
          {isSubmitting ? "Đang gửi" : "Gửi liên kết"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Nhớ mật khẩu rồi? <AuthLink href="/login">Đăng nhập</AuthLink>
      </p>
    </div>
  );
}
