"use client";

import { CircleAlertIcon } from "lucide-react";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { AccountType } from "@/lib/api/types";
import { useCountdown } from "@/lib/use-countdown";
import {
  changeSummary,
  DISCARD,
  SAVE,
  saveFailedTitle,
  SAVING,
  UNSAVED_TITLE,
} from "../admin-permissions-text";
import type { SaveFailure } from "../permission-failure";
import { EDITABLE_TYPES, type EditableType } from "../permission-model";

/**
 * The bar of changes that are not saved yet (scope #24). It sticks to the bottom of the window,
 * because the matrix is long and the buttons would otherwise be far away from the box that was just
 * changed. It says, for each type with changes, how many actions were added and taken away, offers
 * "Hủy thay đổi" and "Lưu thay đổi", and shows why a save did not go through, one notice per type.
 * A type that failed keeps its changes, so a second press sends them again. After a 429 the save
 * button waits out the time the answer gave.
 */
export function SaveBar({
  typeNames,
  changes,
  dirtyTypes,
  failures,
  saving,
  onSave,
  onDiscard,
}: {
  typeNames: Record<AccountType, string>;
  changes: Record<EditableType, { added: number; removed: number }>;
  dirtyTypes: readonly EditableType[];
  failures: Partial<Record<EditableType, SaveFailure>>;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const limited = EDITABLE_TYPES.map((type) => failures[type]).find(
    (failure) => failure?.kind === "rate-limited",
  );
  const secondsLeft = useCountdown(
    limited?.kind === "rate-limited" ? limited.error : null,
  );

  return (
    <div className="sticky bottom-4 z-10">
      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1" aria-live="polite">
            <p className="text-sm font-semibold">{UNSAVED_TITLE}</p>
            {dirtyTypes.map((type) => (
              <p
                key={type}
                className="text-sm text-muted-foreground tabular-nums"
              >
                {changeSummary(typeNames[type], changes[type])}
              </p>
            ))}
          </div>
          {EDITABLE_TYPES.map((type) => {
            const failure = failures[type];
            if (failure === undefined) return null;
            if (failure.kind === "rate-limited") {
              return <RateLimitNotice key={type} error={failure.error} />;
            }
            const lines = [...new Set([failure.message, ...failure.details])];
            return (
              <Alert key={type} variant="destructive">
                <CircleAlertIcon aria-hidden="true" />
                <AlertTitle>{saveFailedTitle(typeNames[type])}</AlertTitle>
                <AlertDescription>
                  {lines.join(" ")}
                  {failure.requestId && ` Mã hỗ trợ: ${failure.requestId}`}
                </AlertDescription>
              </Alert>
            );
          })}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onDiscard}
              disabled={saving}
            >
              {DISCARD}
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={onSave}
              disabled={saving || secondsLeft > 0}
              aria-busy={saving}
            >
              {saving && <Spinner size="sm" />}
              {saving ? SAVING : SAVE}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
