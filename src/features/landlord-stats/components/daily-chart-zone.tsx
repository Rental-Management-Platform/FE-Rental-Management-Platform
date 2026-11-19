"use client";

import { useId, useState } from "react";
import { SeriesTable } from "@/components/stats/series-table";
import { StatsZone } from "@/components/stats/stats-zone";
import { TrendChart } from "@/components/stats/trend-chart";
import { Button } from "@/components/ui/button";
import type { Statistics } from "@/lib/api/types";
import { CHART_METRICS } from "../chart-metrics";
import { chartLabel, tableCaption } from "../landlord-stats-text";

const COLUMNS = CHART_METRICS.map((metric) => ({
  key: metric.key,
  label: metric.columnLabel,
}));

/**
 * The zone "Theo ngày" (spec 0024, AC-8 and AC-9): one chart of the series and, one click away,
 * the same days as a text table with all four columns. The total in the chart's name is the
 * `value` of its Metric, never a sum of the points. The open table is kept while the range
 * changes and reset when the zone mounts again.
 */
export function DailyChartZone({ statistics }: { statistics: Statistics }) {
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();

  const metric = CHART_METRICS[0];
  const points = statistics.series.map((day) => ({
    date: day.date,
    value: day[metric.key],
  }));
  const total = metric.metric(statistics).value;

  return (
    <StatsZone title="Theo ngày">
      <TrendChart
        points={points}
        name={metric.tabLabel}
        unit={metric.unit}
        label={chartLabel(metric, statistics.period, total)}
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
