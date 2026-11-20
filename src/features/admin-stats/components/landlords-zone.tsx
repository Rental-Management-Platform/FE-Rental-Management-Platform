import { StatsZone } from "@/components/stats/stats-zone";
import type { AdminOverview } from "@/lib/api/types";
import {
  LANDLORD_ON_PLAN_LABEL,
  LANDLORD_ON_TRIAL_LABEL,
  LANDLORD_TRIAL_EXPIRED_LABEL,
  LANDLORDS_ZONE_TITLE,
  landlordsTotalLine,
} from "../admin-stats-text";
import { BarRows } from "./bar-rows";

/**
 * The zone "Chủ trọ" (spec 0025, AC-7): the landlords on a plan, on trial and past trial without a
 * plan, each with a bar against the largest of the three, and the total they add up to. All three
 * rows are always drawn. Numbers of the moment: no arrow, and they do not change with the range.
 */
export function LandlordsZone({
  landlords,
}: {
  landlords: AdminOverview["landlords"];
}) {
  return (
    <StatsZone title={LANDLORDS_ZONE_TITLE}>
      <BarRows
        rows={[
          { label: LANDLORD_ON_PLAN_LABEL, count: landlords.onPlan },
          { label: LANDLORD_ON_TRIAL_LABEL, count: landlords.onTrial },
          {
            label: LANDLORD_TRIAL_EXPIRED_LABEL,
            count: landlords.trialExpired,
          },
        ]}
      />
      <p className="text-sm text-muted-foreground">
        {landlordsTotalLine(landlords.total)}
      </p>
    </StatsZone>
  );
}
