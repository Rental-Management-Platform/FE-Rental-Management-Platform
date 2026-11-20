"use client";

import { useId, useMemo, useState } from "react";
import { SeriesTable } from "@/components/stats/series-table";
import { StatsZone } from "@/components/stats/stats-zone";
import { TrendChart } from "@/components/stats/trend-chart";
import { Button } from "@/components/ui/button";
import { fillSeries } from "../fill-series";
import {
  REVENUE_COLUMNS,
  REVENUE_TABS,
  tabPoints,
} from "../revenue-chart-metrics";
import {
  OPEN_TABLE_LABEL,
  TOTAL_ROW_LABEL,
  chartLabel,
  chartZoneTitle,
  tableCaption,
} from "../revenue-text";
import type { ShownRevenue } from "../revenue-view";

/**
 * The zone "Doanh thu theo ngày" (spec 0026, AC-7, AC-8, AC-9 and AC-11): one chart of the money
 * and, one click away, the same days as a text table with both columns and a last row "Tổng". The
 * days come from the view of the answer, and every day with no paid order is filled with 0 (the
 * API's series is sparse). The open table is kept while the range changes and reset when the zone
 * mounts again.
 */
export function RevenueChartZone({ shown }: { shown: ShownRevenue }) {
  const { answer, view } = shown;
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();
  const periods = useMemo(
    () => fillSeries(answer.series, view.from, view.to, view.groupBy),
    [answer.series, view.from, view.to, view.groupBy],
  );
  const tab = REVENUE_TABS[0];

  return (
    <StatsZone title={chartZoneTitle(view.groupBy)}>
      <TrendChart
        points={tabPoints(tab, periods)}
        lines={[{ key: tab.key, name: tab.label, unit: tab.unit }]}
        label={chartLabel(tab, view, answer)}
        yFloor={tab.yFloor}
        yAxisWidth={tab.yAxisWidth}
      />
      <div className="flex flex-col gap-3">
        <div>
          <Button
            type="button"
            variant="outline"
            className="max-md:h-11"
            aria-expanded={tableOpen}
            aria-controls={tableId}
            onClick={() => setTableOpen((open) => !open)}
          >
            {OPEN_TABLE_LABEL}
          </Button>
        </div>
        <div id={tableId}>
          {tableOpen && (
            <SeriesTable
              caption={tableCaption(view)}
              columns={REVENUE_COLUMNS}
              rows={periods}
              footer={{
                label: TOTAL_ROW_LABEL,
                values: {
                  paidAmount: answer.paidAmount,
                  paidCount: answer.paidCount,
                },
              }}
            />
          )}
        </div>
      </div>
    </StatsZone>
  );
}
