"use client";

import { useId, useState } from "react";
import { SeriesTable } from "@/components/stats/series-table";
import { tableCaption } from "@/components/stats/stats-text";
import { StatsZone } from "@/components/stats/stats-zone";
import { TrendChart } from "@/components/stats/trend-chart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminOverview } from "@/lib/api/types";
import {
  ADMIN_CHART_TABS,
  FIRST_TAB,
  isTabId,
  tabPoints,
  type AdminChartTab,
  type AdminChartTabId,
} from "../admin-chart-metrics";
import {
  CHART_TABS_LABEL,
  DAILY_ZONE_TITLE,
  OPEN_TABLE_LABEL,
  chartLabel,
} from "../admin-stats-text";

function TabChart({
  tab,
  overview,
}: {
  tab: AdminChartTab;
  overview: AdminOverview;
}) {
  return (
    <TrendChart
      points={tabPoints(tab, overview.series)}
      lines={tab.lines}
      label={chartLabel(tab, overview)}
    />
  );
}

/**
 * The zone "Theo ngày" (spec 0025, AC-10 and AC-11): one chart of the series with a switcher of six
 * tabs of one or two lines each and, one click away, the same days as a text table with the columns
 * of the chosen tab. The chosen tab and the open table are kept while the range changes and reset
 * when the zone mounts again.
 */
export function DailyChartZone({ overview }: { overview: AdminOverview }) {
  const [selected, setSelected] = useState<AdminChartTabId>(FIRST_TAB);
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();
  const chosen =
    ADMIN_CHART_TABS.find((tab) => tab.id === selected) ?? ADMIN_CHART_TABS[0];

  return (
    <StatsZone title={DAILY_ZONE_TITLE}>
      <Tabs
        value={selected}
        onValueChange={(value) => {
          if (isTabId(value)) setSelected(value);
        }}
      >
        <TabsList aria-label={CHART_TABS_LABEL}>
          {ADMIN_CHART_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {ADMIN_CHART_TABS.map((tab) => (
          // The chart inside is the one stop (arrow keys move over the days), so the panel itself
          // is not a second tab stop in front of it.
          <TabsContent key={tab.id} value={tab.id} tabIndex={-1}>
            <TabChart tab={tab} overview={overview} />
          </TabsContent>
        ))}
      </Tabs>
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
              caption={tableCaption(overview.period)}
              columns={chosen.lines.map((line) => ({
                key: line.key,
                label: line.columnLabel,
              }))}
              rows={overview.series}
            />
          )}
        </div>
      </div>
    </StatsZone>
  );
}
