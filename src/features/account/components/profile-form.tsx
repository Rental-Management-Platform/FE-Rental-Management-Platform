"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { isAbortError } from "@/lib/api/abort";
import type { Profile } from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { useApi, useSessionActions } from "@/lib/session/auth-provider";
import { profileKey, updateProfile } from "../api/profile";
import { toProfilePatch, toProfileValues } from "../profile-patch";
import {
  profileSchema,
  type ProfileFormValues,
  type ProfileInput,
} from "../schemas/profile-schema";

// The form's own paths in screen order, so a message the backend sends for a field this form lacks
// is shown as the form level message and never lost.
const FIELDS: readonly Path<ProfileInput>[] = ["name", "phone"];

// The name and the phone number of the person (api-for-frontend.md, 6.35 and section 7). Only what
// changed is sent. A landlord cannot remove the number, because it is the contact number on every
// listing; a renter can, and the box then sends `null`. The answer of the save is written to the
// cache and the form starts again from it, and the session reads `/auth/me` again so the name in
// the account menu changes at once, with no sign in.
export function ProfileForm({
  profile,
  canEdit,
}: {
  profile: Profile;
  canEdit: boolean;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const { reload } = useSessionActions();
  const isLandlord = profile.accountType === "landlord";
  const resolver = useMemo(
    () => zodResolver(profileSchema(profile.accountType)),
    [profile.accountType],
  );
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput, unknown, ProfileFormValues>({
    resolver,
    defaultValues: toProfileValues(profile),
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: ProfileFormValues) => {
    clearFailure();
    const body = toProfilePatch(profile, values);
    // Nothing differs from what is saved: say so, and send nothing.
    if (Object.keys(body).length === 0) {
      toast("Chưa có gì thay đổi");
      return;
    }
    try {
      const saved = await updateProfile(api, body);
      queryClient.setQueryData(profileKey, saved);
      reset(toProfileValues(saved));
      // The menu reads the name from the session. A read that fails only leaves the old name
      // there until the next one, so it is not worth an error.
      void reload().catch(() => undefined);
      toast.success("Đã lưu hồ sơ");
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (!isAbortError(error)) report(error);
    }
  };

  return (
    <Card role="group" aria-labelledby="profile-form-title">
      <CardHeader className="border-b">
        <CardTitle>
          <h2 id="profile-form-title" className="text-base">
            Hồ sơ
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          method="post"
          aria-label="Hồ sơ"
          onSubmit={handleSubmit(onSubmit, clearFailure)}
          className="flex flex-col gap-6"
        >
          <FieldGroup>
            <FormField
              control={control}
              name="name"
              label="Tên (không bắt buộc)"
              description="Tối đa 100 ký tự."
            >
              {({ field, aria }) => (
                <Input
                  type="text"
                  size="lg"
                  autoComplete="name"
                  placeholder="Tên của bạn"
                  readOnly={!canEdit}
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
                isLandlord
                  ? "Số này là số liên hệ hiện trên mọi tin của bạn. Đổi số là đổi ở mọi tin cùng lúc."
                  : "Để trống nếu bạn không muốn lưu số."
              }
            >
              {({ field, aria }) => (
                <Input
                  type="tel"
                  size="lg"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="0912 345 678"
                  readOnly={!canEdit}
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
          {canEdit ? (
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || secondsLeft > 0}
                aria-busy={isSubmitting}
              >
                {isSubmitting && <Spinner size="sm" />}
                {isSubmitting ? "Đang lưu" : "Lưu thay đổi"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Loại tài khoản của bạn hiện chưa được sửa hồ sơ.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
