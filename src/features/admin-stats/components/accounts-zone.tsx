import { StatRow } from "@/components/stats/stat-row";
import { StatsZone } from "@/components/stats/stats-zone";
import type { AccountCounts, AdminOverview } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import {
  ACCOUNT_ADMIN_LABEL,
  ACCOUNT_LANDLORD_LABEL,
  ACCOUNT_TENANT_LABEL,
  ACCOUNTS_TOTAL_LABEL,
  ACCOUNTS_ZONE_TITLE,
  accountsQuietLine,
} from "../admin-stats-text";
import { BarRows } from "./bar-rows";

const quiet = ({ active, locked }: AccountCounts) =>
  accountsQuietLine(active, locked);

/**
 * The zone "Tài khoản" (spec 0025, AC-6): how many accounts there are now, with how many are active
 * and locked, then the same for each account type with a bar against the largest of the three.
 * Numbers of the moment: no arrow, and they do not change with the range.
 */
export function AccountsZone({
  accounts,
}: {
  accounts: AdminOverview["accounts"];
}) {
  const { byType } = accounts;
  return (
    <StatsZone title={ACCOUNTS_ZONE_TITLE}>
      <StatRow
        label={ACCOUNTS_TOTAL_LABEL}
        value={formatCount(accounts.total)}
        note={quiet(accounts)}
        muted={accounts.total === 0}
        className="border-b pb-4"
      />
      <BarRows
        rows={[
          {
            label: ACCOUNT_ADMIN_LABEL,
            count: byType.admin.total,
            note: quiet(byType.admin),
          },
          {
            label: ACCOUNT_LANDLORD_LABEL,
            count: byType.landlord.total,
            note: quiet(byType.landlord),
          },
          {
            label: ACCOUNT_TENANT_LABEL,
            count: byType.tenant.total,
            note: quiet(byType.tenant),
          },
        ]}
      />
    </StatsZone>
  );
}
