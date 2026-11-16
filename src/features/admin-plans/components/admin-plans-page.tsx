"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlertIcon, TagsIcon } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { isAbortError } from "@/lib/api/abort";
import { isApiError } from "@/lib/api/errors";
import type { AdminPlan } from "@/lib/api/types";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useCountdown } from "@/lib/use-countdown";
import { useReturnFocus } from "@/lib/use-return-focus";
import {
  ADD_PLAN,
  ADMIN_PLANS_DESCRIPTION,
  ADMIN_PLANS_FORBIDDEN_MESSAGE,
  ADMIN_PLANS_TITLE,
  GONE_TOAST,
  NO_PLANS_DESCRIPTION,
  NO_PLANS_TITLE,
  PLANS_FAILED_TITLE,
  PLANS_TITLE,
  plansHeading,
  toggleFailedTitle,
  turnedOffToast,
  turnedOnToast,
} from "../admin-plans-text";
import { adminPlansQuery } from "../api/plans";
import { useDeletePlanFlow } from "../hooks/use-delete-plan-flow";
import { usePlanMutations } from "../hooks/use-plan-mutations";
import { classifyPlanError, type PlanFailure } from "../plan-failure";
import { DeletePlanDialog } from "./delete-plan-dialog";
import { PlanCards } from "./plan-cards";
import { PlanDialog } from "./plan-dialog";
import { PlansTable } from "./plans-table";
import { TrialSettingsZone } from "./trial-settings-zone";

const HEADING_ID = "plans-title";

/**
 * "Gói và dùng thử" (scope #22): every plan with its sale switch, "Thêm gói", "Sửa" and "Xóa",
 * and below it the two trial settings. It runs in the browser, because the lists need a login, and
 * sits behind the route gate of the admin. The two zones read on their own, so a failure in one
 * leaves the other working. A button is drawn only for the permission it needs, and the backend
 * still decides.
 *
 * Writes happen in three places: the dialog of a create or a save, the sale switch of a row, and
 * the delete dialog. Each waits for the list to be read again before it ends, so the table is
 * right when a dialog closes. Focus: a dialog that opens from a row or the header button gives
 * focus back to it, and to the heading of the table when that button is gone (a row deleted).
 */
export function AdminPlansPage() {
  const api = useApi();
  const session = useSession();
  const mayRead = can(session, "plan:read");
  const mayCreate = can(session, "plan:create");
  const mayUpdate = can(session, "plan:update");
  const mayDelete = can(session, "plan:delete");
  const query = useQuery({ ...adminPlansQuery(api), enabled: mayRead });
  const { data } = query;

  const heading = useRef<HTMLHeadingElement>(null);
  const planFocus = useReturnFocus(() => heading.current);
  const deleteFocus = useReturnFocus(() => heading.current);
  const [planDialog, setPlanDialog] = useState<{
    open: boolean;
    plan: AdminPlan | null;
  }>({ open: false, plan: null });
  const del = useDeletePlanFlow();

  // The sale switch. One ref guards it, because state lags a render behind a fast second press.
  const { update } = usePlanMutations();
  const toggling = useRef(false);
  const [busy, setBusy] = useState(false);
  const [toggleFailure, setToggleFailure] = useState<{
    name: string;
    failure: PlanFailure;
  } | null>(null);

  const toggle = async (plan: AdminPlan, isActive: boolean) => {
    if (toggling.current) return;
    toggling.current = true;
    setBusy(true);
    setToggleFailure(null);
    try {
      await update.mutateAsync({ id: plan.id, patch: { isActive } });
      toast.success(
        isActive ? turnedOnToast(plan.name) : turnedOffToast(plan.name),
      );
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (isAbortError(error)) return;
      const failure = classifyPlanError(error);
      if (failure.kind === "gone") toast(GONE_TOAST);
      else setToggleFailure({ name: plan.name, failure });
    } finally {
      toggling.current = false;
      setBusy(false);
    }
  };

  const openCreate = () => {
    planFocus.remember();
    setPlanDialog({ open: true, plan: null });
  };
  const openEdit = (plan: AdminPlan) => {
    planFocus.remember();
    setPlanDialog({ open: true, plan });
  };
  const askDelete = (plan: AdminPlan) => {
    deleteFocus.remember();
    del.ask(plan);
  };

  if (
    !mayRead ||
    (data === undefined &&
      isApiError(query.error) &&
      query.error.status === 403 &&
      query.error.code === "PERMISSION_DENIED")
  ) {
    return <ForbiddenState message={ADMIN_PLANS_FORBIDDEN_MESSAGE} />;
  }

  const renderBody = (): ReactNode => {
    if (data === undefined) {
      return query.isError ? (
        <ListFailure error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <LoadingState variant="table" />
      );
    }
    if (data.items.length === 0) {
      return (
        <EmptyState
          icon={TagsIcon}
          title={NO_PLANS_TITLE}
          description={NO_PLANS_DESCRIPTION}
          action={
            mayCreate ? (
              <Button type="button" size="lg" onClick={openCreate}>
                {ADD_PLAN}
              </Button>
            ) : undefined
          }
        />
      );
    }
    const list = {
      rows: data.items,
      canUpdate: mayUpdate,
      canDelete: mayDelete,
      busy,
      onToggle: (plan: AdminPlan, isActive: boolean) =>
        void toggle(plan, isActive),
      onEdit: openEdit,
      onDelete: askDelete,
    };
    return (
      <>
        {/* The same rows twice: a table from `md` and stacked blocks below it. The hidden one is
            `display: none`, so a screen reader reads only one. */}
        <div className="hidden md:block">
          <PlansTable {...list} />
        </div>
        <div className="md:hidden">
          <PlanCards {...list} />
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ADMIN_PLANS_TITLE}
        description={ADMIN_PLANS_DESCRIPTION}
        actions={
          mayCreate ? (
            <Button type="button" size="lg" onClick={openCreate}>
              {ADD_PLAN}
            </Button>
          ) : null
        }
      />

      {toggleFailure !== null && <ToggleNotice {...toggleFailure} />}

      {/* One zone: the title row holds the count, the rows run edge to edge under it. Focus lands
          on the title when a row leaves, so it takes focus by code and has no ring of its own. */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            <h2
              id={HEADING_ID}
              ref={heading}
              tabIndex={-1}
              aria-live="polite"
              className="text-base outline-hidden"
            >
              {data === undefined ? PLANS_TITLE : plansHeading(data.items)}
            </h2>
          </CardTitle>
        </CardHeader>
        {renderBody()}
      </Card>

      <TrialSettingsZone />

      <PlanDialog
        open={planDialog.open}
        plan={planDialog.plan}
        onOpenChange={(open) => setPlanDialog((d) => ({ ...d, open }))}
        onCloseAutoFocus={planFocus.onCloseAutoFocus}
      />
      <DeletePlanDialog
        plan={del.target}
        open={del.open}
        onOpenChange={del.onOpenChange}
        pending={del.pending}
        failure={del.failure}
        canTurnOff={mayUpdate}
        onConfirm={del.confirm}
        onTurnOff={del.turnOff}
        onCloseAutoFocus={deleteFocus.onCloseAutoFocus}
      />
    </div>
  );
}

// Why a sale switch did not change, above the table. It stays until the next press.
function ToggleNotice({
  name,
  failure,
}: {
  name: string;
  failure: PlanFailure;
}) {
  if (failure.kind === "rate-limited") {
    return <RateLimitNotice error={failure.error} />;
  }
  if (failure.kind !== "message") return null;
  return (
    <Alert variant="destructive">
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>{toggleFailedTitle(name)}</AlertTitle>
      <AlertDescription>
        {failure.message}
        {failure.requestId && ` Mã hỗ trợ: ${failure.requestId}`}
      </AlertDescription>
    </Alert>
  );
}

// A failed first read: a 429 shows the wait counting down, anything else the error. "Thử lại"
// stays off while the wait runs.
function ListFailure({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  if (isApiError(error) && error.status === 429) {
    return (
      <div className="flex flex-col items-start gap-4 px-(--card-spacing)">
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
    <ErrorState error={error} title={PLANS_FAILED_TITLE} onRetry={onRetry} />
  );
}
