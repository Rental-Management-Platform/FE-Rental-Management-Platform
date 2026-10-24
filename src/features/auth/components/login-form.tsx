"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm, type Path } from "react-hook-form";
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
import { loginSchema, type LoginValues } from "../schemas/login-schema";
import { AuthLink } from "./auth-link";
import { SessionNotice } from "./session-notice";

// The form's own paths, so a message the backend sends for a field this form lacks is shown as
// the form level message and never lost.
const FIELDS: readonly Path<LoginValues>[] = ["email", "password"];

// The sign in page below its `CardHeader` (spec 0005, AC-1, AC-2, AC-8). The session decides
// what shows: the skeleton while it loads, the form for a guest, nothing for a signed in
// person, who is moved away by `useAuthPage`.
export function LoginForm() {
  const next = useSearchParams().get("next");
  const { view, guest, retrying, restore } = useAuthPage(next);

  if (view === "loading") return <LoadingState variant="form" fields={2} />;
  if (view === "none" || guest === null) return null;

  return (
    <div className="flex flex-col gap-4">
      <SessionNotice guest={guest} retrying={retrying} onRetry={restore} />
      <LoginFields />
      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <AuthLink href={authHref("/register", next)}>Đăng ký</AuthLink>
      </p>
    </div>
  );
}

// Apart from `LoginForm` so the typed values live in a component that stays mounted for as
// long as the form is shown, whatever the session does meanwhile.
function LoginFields() {
  const { signIn } = useSessionActions();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
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

  // Success is not handled here: the session becomes `user`, and `useAuthPage` moves the
  // person to the landing path.
  const onSubmit = async (values: LoginValues) => {
    clearFailure();
    try {
      await signIn(values);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): there is nothing to show.
      if (!isAbortError(error)) report(error);
    }
  };

  return (
    <form
      noValidate
      method="post"
      aria-label="Đăng nhập"
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      className="flex flex-col gap-4"
    >
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
        <FormField control={control} name="password" label="Mật khẩu">
          {({ field, aria }) => (
            <PasswordInput
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              {...field}
              {...aria}
            />
          )}
        </FormField>
      </FieldGroup>
      <FailureNotice failure={failure} message={errors.root?.server?.message} />
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting || secondsLeft > 0}
        aria-busy={isSubmitting}
      >
        {isSubmitting && <Spinner size="sm" />}
        {isSubmitting ? "Đang đăng nhập" : "Đăng nhập"}
      </Button>
    </form>
  );
}
