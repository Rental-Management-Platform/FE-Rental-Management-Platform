"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { PasswordInput } from "@/components/form/password-input";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { isAbortError } from "@/lib/api/abort";
import { isApiError } from "@/lib/api/errors";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import {
  useApi,
  useSession,
  useSessionActions,
} from "@/lib/session/auth-provider";
import { resetPassword } from "../api/password-recovery";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "../schemas/reset-password-schema";
import { AuthLink } from "./auth-link";
import { ResetLinkInvalid } from "./reset-link-invalid";

// The form's own paths, so a message the backend sends for a field this form lacks is shown as
// the form level message and never lost.
const FIELDS: readonly Path<ResetPasswordValues>[] = ["newPassword"];

// The code in the link, or `null` when the address has none (or only blanks).
const tokenOf = (raw: string | null) =>
  raw === null || raw.trim() === "" ? null : raw;

// The reset page below its `CardHeader`. The email points at `/reset-password?token=...`, a path
// that cannot change. The code is read once into state and then taken out of the address bar, so
// it does not stay in the history or travel in a `Referer` header (api-for-frontend.md, section
// 7). Like the page that asks for a link, it works whoever is looking, signed in or not.
export function ResetPasswordForm() {
  const initialToken = useSearchParams().get("token");
  const [token, setToken] = useState(() => tokenOf(initialToken));
  // True once a send was answered `RESET_TOKEN_INVALID`: the form is then replaced by the notice.
  const [dropped, setDropped] = useState(false);

  // Native History API, which the Next.js router follows: no navigation, no request and no new
  // history entry. Only the `token` parameter goes. Running it twice (StrictMode) changes nothing
  // the second time, because the state above already holds the code.
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    const rest = new URLSearchParams(search);
    if (!rest.has("token")) return;
    rest.delete("token");
    const query = rest.toString();
    window.history.replaceState(
      null,
      "",
      `${pathname}${query === "" ? "" : `?${query}`}${hash}`,
    );
  }, []);

  if (token === null) return <ResetLinkInvalid moveFocus={dropped} />;

  return (
    <ResetFields
      token={token}
      onInvalid={() => {
        setDropped(true);
        setToken(null);
      }}
    />
  );
}

// Apart from `ResetPasswordForm` so the typed password lives in a component that stays mounted
// for as long as the form is shown.
function ResetFields({
  token,
  onInvalid,
}: {
  token: string;
  onInvalid: () => void;
}) {
  const api = useApi();
  const router = useRouter();
  const session = useSession();
  const { signOut } = useSessionActions();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "" },
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async ({ newPassword }: ResetPasswordValues) => {
    clearFailure();
    try {
      await resetPassword(api, { token, newPassword });
    } catch (error) {
      if (isAbortError(error)) return;
      // A dead link cannot be fixed by typing again, so the form gives way to a way out.
      if (isApiError(error) && error.code === "RESET_TOKEN_INVALID") {
        onInvalid();
        return;
      }
      // `VALIDATION_FAILED` leaves the link unused, so the form stays and the person tries again.
      report(error);
      return;
    }

    // Every session of the account is over on the server. A browser that was signed in as this
    // account would otherwise be moved away from the sign in page as a signed in person.
    if (session.status === "user") await signOut();
    toast.success("Đã đặt lại mật khẩu", {
      description: "Hãy đăng nhập bằng mật khẩu mới.",
    });
    router.replace("/login");
  };

  return (
    <div className="flex flex-col gap-4">
      <form
        noValidate
        method="post"
        aria-label="Đặt lại mật khẩu"
        onSubmit={handleSubmit(onSubmit, clearFailure)}
        className="flex flex-col gap-4"
      >
        <FieldGroup>
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
          Sau khi đặt lại, mọi thiết bị đang đăng nhập tài khoản này sẽ phải
          đăng nhập lại.
        </p>
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
          {isSubmitting ? "Đang đặt lại" : "Đặt lại mật khẩu"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <AuthLink href="/login">Quay lại đăng nhập</AuthLink>
      </p>
    </div>
  );
}
