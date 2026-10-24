"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch, type Path } from "react-hook-form";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { PasswordInput } from "@/components/form/password-input";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { isAbortError } from "@/lib/api/abort";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { authHref } from "@/lib/next-path";
import { useSessionActions } from "@/lib/session/auth-provider";
import { useAuthPage } from "../hooks/use-auth-page";
import {
  registerSchema,
  toRegisterBody,
  type RegisterInput,
  type RegisterValues,
} from "../schemas/register-schema";
import { AccountTypeChoice } from "./account-type-choice";
import { AuthLink } from "./auth-link";
import { SessionNotice } from "./session-notice";

// The form's own paths in screen order. A message the backend sends for a field this form
// lacks is shown as the form level message, and focus goes to the first field in this order.
const FIELDS: readonly Path<RegisterInput>[] = [
  "accountType",
  "email",
  "password",
  "name",
  "phone",
];

// The sign up page below its `CardHeader` (spec 0005, AC-3 to AC-6, AC-8). The session decides
// what shows, as on the sign in page.
export function RegisterForm() {
  const next = useSearchParams().get("next");
  const { view, guest, retrying, restore } = useAuthPage(next);

  if (view === "loading") return <LoadingState variant="form" fields={2} />;
  if (view === "none" || guest === null) return null;

  return (
    <div className="flex flex-col gap-4">
      <SessionNotice guest={guest} retrying={retrying} onRetry={restore} />
      <RegisterFields />
      <p className="text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <AuthLink href={authHref("/login", next)}>Đăng nhập</AuthLink>
      </p>
    </div>
  );
}

// Apart from `RegisterForm` so the typed values live in a component that stays mounted for as
// long as the form is shown, whatever the session does meanwhile.
function RegisterFields() {
  const { signUp } = useSessionActions();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<RegisterInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "",
      email: "",
      password: "",
      name: "",
      phone: "",
    },
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );
  const accountType = useWatch({ control, name: "accountType" });
  const isLandlord = accountType === "landlord";

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  // Switching the card keeps everything that was typed and changes only the phone rule. The
  // old phone message belongs to the old rule, so it goes; the new rule is applied again only
  // when a send was already tried, so a person is not told off before they have started.
  const onTypeChange = (change: () => void) => {
    change();
    clearErrors("phone");
    if (submitCount > 0) void trigger("phone");
  };

  // Success is not handled here: the session becomes `user`, and `useAuthPage` moves the
  // person to the landing path.
  const onSubmit = async (values: RegisterValues) => {
    clearFailure();
    try {
      await signUp(toRegisterBody(values));
    } catch (error) {
      // The session changed under the request (a sign out in this tab): there is nothing to show.
      if (!isAbortError(error)) report(error);
    }
  };

  return (
    <form
      noValidate
      method="post"
      aria-label="Đăng ký"
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      className="flex flex-col gap-5"
    >
      <Controller
        control={control}
        name="accountType"
        render={({ field, fieldState }) => (
          <AccountTypeChoice
            value={field.value}
            onChange={(value) => onTypeChange(() => field.onChange(value))}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            firstCardRef={field.ref}
          />
        )}
      />

      {accountType !== "" && (
        <>
          <FieldGroup>
            <FormField control={control} name="email" label="Email">
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
            <FormField
              control={control}
              name="password"
              label="Mật khẩu"
              description="Từ 8 đến 128 ký tự."
            >
              {({ field, aria }) => (
                <PasswordInput
                  autoComplete="new-password"
                  placeholder="Tạo mật khẩu"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
            <FormField
              control={control}
              name="name"
              label="Tên (không bắt buộc)"
            >
              {({ field, aria }) => (
                <Input
                  type="text"
                  size="lg"
                  autoComplete="name"
                  placeholder="Tên của bạn"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
            <FormField
              control={control}
              name="phone"
              label={
                isLandlord ? "Số điện thoại" : "Số điện thoại (không bắt buộc)"
              }
              description={
                isLandlord ? "Dùng để người tìm trọ liên hệ bạn." : undefined
              }
            >
              {({ field, aria }) => (
                <Input
                  type="tel"
                  size="lg"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="0912 345 678"
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
            {isSubmitting ? "Đang tạo tài khoản" : "Tạo tài khoản"}
          </Button>
        </>
      )}
    </form>
  );
}
