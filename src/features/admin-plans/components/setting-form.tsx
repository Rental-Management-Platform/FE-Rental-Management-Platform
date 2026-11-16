"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { isAbortError } from "@/lib/api/abort";
import type { Setting } from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { formatDateTime } from "@/lib/format";
import { useApi } from "@/lib/session/auth-provider";
import {
  editedLine,
  NEVER_EDITED,
  READ_ONLY_NOTE,
  SETTING_LABEL,
  SETTING_SAVE,
  SETTING_SAVING,
  settingSavedToast,
} from "../admin-plans-text";
import { settingsKey } from "../api/admin-plans-keys";
import { updateSetting } from "../api/settings";
import {
  settingSchema,
  type SettingInput,
  type SettingValues,
} from "../schemas/setting-schema";

const FIELDS: readonly Path<SettingInput>[] = ["value"];

/**
 * One trial setting (scope #22, api-for-frontend.md 6.24): a whole number between the `min` and
 * `max` the API sent with it, saved on its own because each key is its own `PATCH`. The answer of a
 * save goes straight into the cache, so the box, the "last changed" line and the other readers
 * agree at once. A box the person has not touched follows the value of the server (another tab
 * saved), and a touched one is left alone. `editor` is who changed it last, already worded.
 */
export function SettingForm({
  setting,
  editor,
  canEdit,
}: {
  setting: Setting;
  /** "bạn", a name, or "một quản trị viên". Unused until the setting has been changed. */
  editor: string;
  canEdit: boolean;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const schema = useMemo(
    () => settingSchema(setting.min, setting.max),
    [setting.min, setting.max],
  );
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingInput, unknown, SettingValues>({
    resolver: zodResolver(schema),
    defaultValues: { value: String(setting.value) },
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );

  const save = useMutation({
    mutationFn: (value: number) => updateSetting(api, setting.key, value),
    onSuccess: (saved) =>
      queryClient.setQueryData<Setting[]>(settingsKey, (old) =>
        old?.map((entry) => (entry.key === saved.key ? saved : entry)),
      ),
  });

  // A box nobody has touched shows the value the server has now.
  useEffect(() => {
    if (!isDirty) reset({ value: String(setting.value) });
  }, [isDirty, reset, setting.value]);

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: SettingValues) => {
    clearFailure();
    try {
      const saved = await save.mutateAsync(values.value);
      reset({ value: String(saved.value) });
      toast.success(settingSavedToast(saved.key));
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (!isAbortError(error)) report(error);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <form
        noValidate
        method="post"
        aria-label={SETTING_LABEL[setting.key]}
        onSubmit={handleSubmit(onSubmit, clearFailure)}
        className="flex flex-col items-start gap-4"
      >
        <FormField
          control={control}
          name="value"
          label={SETTING_LABEL[setting.key]}
          className="w-full"
        >
          {({ field, aria }) => (
            <Input
              size="lg"
              className="max-w-48"
              inputMode="numeric"
              autoComplete="off"
              readOnly={!canEdit}
              {...field}
              {...aria}
            />
          )}
        </FormField>
        <FailureNotice
          failure={failure}
          message={errors.root?.server?.message}
          className="w-full"
        />
        {canEdit && (
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || secondsLeft > 0 || !isDirty}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <Spinner size="sm" />}
            {isSubmitting ? SETTING_SAVING : SETTING_SAVE}
          </Button>
        )}
      </form>
      <p className="text-sm text-muted-foreground">
        {setting.updatedAt === null
          ? NEVER_EDITED
          : editedLine(editor, formatDateTime(setting.updatedAt))}
        {!canEdit && ` ${READ_ONLY_NOTE}`}
      </p>
    </div>
  );
}
