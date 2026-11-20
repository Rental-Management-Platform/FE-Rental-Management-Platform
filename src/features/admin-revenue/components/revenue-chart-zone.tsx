"use client";

import { useId, useMemo, useState } from "react";
import { SeriesTable } from "@/components/stats/series-table";
import { StatsZone } from "@/components/stats/stats-zone";
import { TrendChart } from "@/components/stats/trend-chart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fillSeries } from "../fill-series";
import {
  FIRST_TAB,
  REVENUE_COLUMNS,
  REVENUE_TABS,
  isTabId,
  tabPoints,
  type RevenueTab,
  type RevenueTabId,
} from "../revenue-chart-metrics";
import {
  CHART_TABS_LABEL,
  MONTH_NOTE,
  OPEN_TABLE_LABEL,
  TOTAL_ROW_LABEL,
  chartLabel,
  chartZoneTitle,
  tableCaption,
} from "../revenue-text";
import type { FilledPeriod } from "../fill-series";
import type { ShownRevenue } from "../revenue-view";

function TabChart({
  tab,
  periods,
  shown,
}: {
  tab: RevenueTab;
  periods: readonly FilledPeriod[];
  shown: ShownRevenue;
}) {
  const { answer, view } = shown;
  return (
    <TrendChart
      points={tabPoints(tab, periods)}
      lines={[{ key: tab.key, name: tab.label, unit: tab.unit }]}
      label={chartLabel(tab, view, answer)}
      yFloor={tab.yFloor}
      yAxisWidth={tab.yAxisWidth}
      grain={view.groupBy}
    />
  );
}

/**
 * The zone "Doanh thu theo ngày" or "theo tháng" (spec 0026, AC-7, AC-8, AC-9 and AC-11): one chart
 * with a switcher of two tabs, "Doanh thu" and "Đơn đã trả", each on its own scale, and, one click
 * away, the same periods as a text table with both columns and a last row "Tổng". The periods come
 * from the view of the answer, and every day or month with no paid order is filled with 0 (the
 * API's series is sparse). The chosen tab and the open table are kept while the range or the
 * grouping changes and reset when the zone mounts again.
 */
export function RevenueChartZone({ shown }: { shown: ShownRevenue }) {
  const { answer, view } = shown;
  const [selected, setSelected] = useState<RevenueTabId>(FIRST_TAB);
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();
  const periods = useMemo(
    () => fillSeries(answer.series, view.from, view.to, view.groupBy),
    [answer.series, view.from, view.to, view.groupBy],
  );

  return (
    <StatsZone title={chartZoneTitle(view.groupBy)}>
      <Tabs
        value={selected}
        onValueChange={(value) => {
          if (isTabId(value)) setSelected(value);
        }}
      >
        <TabsList aria-label={CHART_TABS_LABEL}>
          {REVENUE_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {REVENUE_TABS.map((tab) => (
          // The chart inside is the one stop (arrow keys move over the periods), so the panel
          // itself is not a second tab stop in front of it.
          <TabsContent key={tab.id} value={tab.id} tabIndex={-1}>
            <TabChart tab={tab} periods={periods} shown={shown} />
          </TabsContent>
        ))}
      </Tabs>
      {view.groupBy === "month" && (
        <p className="text-sm text-muted-foreground">{MONTH_NOTE}</p>
      )}
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
              grain={view.groupBy}
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
