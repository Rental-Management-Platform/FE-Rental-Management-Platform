"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { PasswordInput } from "@/components/form/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { isAbortError } from "@/lib/api/abort";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { useApi } from "@/lib/session/auth-provider";
import { changePassword } from "../api/password";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "../schemas/password-schema";

// The form's own paths in screen order, so a message the backend sends for a field this form lacks
// is shown as the form level message and never lost.
const FIELDS: readonly Path<ChangePasswordValues>[] = [
  "currentPassword",
  "newPassword",
];

// Change the password (api-for-frontend.md, 6.9 and section 7). The person stays signed in here,
// and the other devices have to sign in again, so the page says so before the send and again in
// the notice after it. A wrong current password lands on its own box through `useFormFailure`.
// It counts toward a limit of 10 in 15 minutes, which shows as the usual countdown.
export function ChangePasswordForm() {
  const api = useApi();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: ChangePasswordValues) => {
    clearFailure();
    try {
      await changePassword(api, values);
      // Both boxes empty again, so a password never stays on the screen.
      reset();
      toast.success("Đã đổi mật khẩu", {
        description: "Các thiết bị khác sẽ phải đăng nhập lại.",
      });
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (!isAbortError(error)) report(error);
    }
  };

  return (
    <Card role="group" aria-labelledby="change-password-title">
      <CardHeader className="border-b">
        <CardTitle>
          <h2 id="change-password-title" className="text-base">
            Đổi mật khẩu
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          method="post"
          aria-label="Đổi mật khẩu"
          onSubmit={handleSubmit(onSubmit, clearFailure)}
          className="flex flex-col gap-6"
        >
          <FieldGroup>
            <FormField
              control={control}
              name="currentPassword"
              label="Mật khẩu hiện tại"
            >
              {({ field, aria }) => (
                <PasswordInput
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu hiện tại"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
            <FormField
              control={control}
              name="newPassword"
              label="Mật khẩu mới"
              description="Từ 8 đến 128 ký tự."
            >
              {({ field, aria }) => (
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="Tạo mật khẩu mới"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
          </FieldGroup>
          <p className="text-sm text-muted-foreground">
            Bạn vẫn đăng nhập trên thiết bị này. Các thiết bị khác đang dùng tài
            khoản này sẽ phải đăng nhập lại.
          </p>
          <FailureNotice
            failure={failure}
            message={errors.root?.server?.message}
          />
          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || secondsLeft > 0}
              aria-busy={isSubmitting}
            >
              {isSubmitting && <Spinner size="sm" />}
              {isSubmitting ? "Đang đổi" : "Đổi mật khẩu"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
