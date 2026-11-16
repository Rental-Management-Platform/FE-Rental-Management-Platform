"use client";

import { useQuery } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { ErrorState } from "@/components/states/error-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/lib/api/errors";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useCountdown } from "@/lib/use-countdown";
import {
  SETTINGS_FAILED_TITLE,
  TRIAL_NOTE,
  TRIAL_NOTE_TITLE,
  TRIAL_TITLE,
} from "../admin-plans-text";
import { adminNamesQuery, settingsQuery } from "../api/settings";
import { whoEdited } from "../who-edited";
import { SettingForm } from "./setting-form";

const TITLE_ID = "trial-settings-title";

/**
 * The two trial settings, the days and the listings (scope #22): a zone of its own with its own
 * read, so a failure here never touches the plans, and the other way round. A person without
 * `setting:read` gets no zone and no request; one without `setting:update` reads the numbers and
 * has no save button. The zone says first what a change does, because the two settings are not
 * alike: the days only reach people who sign up after the change, the listings reach everyone
 * still in a trial at once.
 *
 * "Who changed it last" is an id in the answer. The admins are read only when a setting has been
 * changed and the person holds `user:read`, and the page falls back to "một quản trị viên".
 */
export function TrialSettingsZone() {
  const api = useApi();
  const session = useSession();
  const maySee = can(session, "setting:read");
  const mayEdit = can(session, "setting:update");
  const mayFindNames = can(session, "user:read");
  const settings = useQuery({ ...settingsQuery(api), enabled: maySee });
  const anyEdited = settings.data?.some((s) => s.updatedBy !== null) ?? false;
  const admins = useQuery({
    ...adminNamesQuery(api),
    enabled: mayFindNames && anyEdited,
  });

  if (!maySee) return null;

  const me = session.status === "user" ? session.user.id : null;

  const renderBody = () => {
    if (settings.data !== undefined) {
      // Side by side from `lg`: each setting is its own small form, and they read as a pair.
      return (
        <div className="grid gap-6 border-t pt-6 lg:grid-cols-2">
          {settings.data.map((setting) => (
            <SettingForm
              key={setting.key}
              setting={setting}
              editor={whoEdited(setting.updatedBy, me, admins.data)}
              canEdit={mayEdit}
            />
          ))}
        </div>
      );
    }
    return settings.isError ? (
      <SettingsFailure
        error={settings.error}
        onRetry={() => void settings.refetch()}
      />
    ) : (
      <SettingsSkeleton />
    );
  };

  return (
    <Card role="group" aria-labelledby={TITLE_ID}>
      <CardHeader className="border-b">
        <CardTitle>
          <h2 id={TITLE_ID} className="text-base">
            {TRIAL_TITLE}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Alert variant="info">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>{TRIAL_NOTE_TITLE}</AlertTitle>
          <AlertDescription>{TRIAL_NOTE}</AlertDescription>
        </Alert>
        {renderBody()}
      </CardContent>
    </Card>
  );
}

// The shape of the two settings, so the zone does not jump when they arrive.
function SettingsSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Đang tải</span>
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-11 w-48 rounded-lg" />
          <Skeleton className="h-11 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// A failed first read: a 429 shows the wait counting down, anything else the error. "Thử lại"
// stays off while the wait runs.
function SettingsFailure({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  if (isApiError(error) && error.status === 429) {
    return (
      <div className="flex flex-col items-start gap-4">
        <RateLimitNotice error={error} className="w-full" />
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onRetry}
          disabled={secondsLeft > 0}
        >
          Thử lại
        </Button>
      </div>
    );
  }
  return (
    <ErrorState
      error={error}
      title={SETTINGS_FAILED_TITLE}
      onRetry={onRetry}
      className="p-0"
    />
  );
}
