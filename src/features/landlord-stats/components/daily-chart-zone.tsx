"use client";

import { useId, useState } from "react";
import { SeriesTable } from "@/components/stats/series-table";
import { StatsZone } from "@/components/stats/stats-zone";
import { TrendChart } from "@/components/stats/trend-chart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Statistics } from "@/lib/api/types";
import {
  CHART_METRICS,
  type ChartMetric,
  type SeriesKey,
} from "../chart-metrics";
import { chartLabel, tableCaption } from "../landlord-stats-text";

// The table lists all four columns whichever tab is chosen.
const COLUMNS = CHART_METRICS.map((metric) => ({
  key: metric.key,
  label: metric.columnLabel,
}));

const isSeriesKey = (value: string): value is SeriesKey =>
  CHART_METRICS.some((metric) => metric.key === value);

function MetricChart({
  metric,
  statistics,
}: {
  metric: ChartMetric;
  statistics: Statistics;
}) {
  const points = statistics.series.map((day) => ({
    date: day.date,
    value: day[metric.key],
  }));
  // The total of the range is the `value` of the Metric, never a sum of the points.
  const total = metric.metric(statistics).value;
  return (
    <TrendChart
      points={points}
      name={metric.tabLabel}
      unit={metric.unit}
      label={chartLabel(metric, statistics.period, total)}
    />
  );
}

/**
 * The zone "Theo ngày" (spec 0024, AC-8 and AC-9): one chart of the series with a switcher of four
 * choices and, one click away, the same days as a text table with all four columns. The chosen tab
 * and the open table are kept while the range changes and reset when the zone mounts again.
 */
export function DailyChartZone({ statistics }: { statistics: Statistics }) {
  const [selected, setSelected] = useState<SeriesKey>("views");
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();

  return (
    <StatsZone title="Theo ngày">
      <Tabs
        value={selected}
        onValueChange={(value) => {
          if (isSeriesKey(value)) setSelected(value);
        }}
      >
        <TabsList aria-label="Số liệu của biểu đồ">
          {CHART_METRICS.map((metric) => (
            <TabsTrigger key={metric.key} value={metric.key}>
              {metric.tabLabel}
            </TabsTrigger>
          ))}
        </TabsList>
        {CHART_METRICS.map((metric) => (
          <TabsContent key={metric.key} value={metric.key}>
            <MetricChart metric={metric} statistics={statistics} />
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
            Xem bảng số liệu
          </Button>
        </div>
        <div id={tableId}>
          {tableOpen && (
            <SeriesTable
              caption={tableCaption(statistics.period)}
              columns={COLUMNS}
              rows={statistics.series}
            />
          )}
        </div>
      </div>
    </StatsZone>
  );
}
