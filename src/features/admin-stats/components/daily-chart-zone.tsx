"use client";

import { useId, useState } from "react";
import { rangeText, tableCaption } from "@/components/stats/stats-text";
import { SeriesTable } from "@/components/stats/series-table";
import { StatsZone } from "@/components/stats/stats-zone";
import { TrendChart } from "@/components/stats/trend-chart";
import { Button } from "@/components/ui/button";
import type { AdminOverview } from "@/lib/api/types";
import { formatCount } from "@/lib/format";

const COLUMNS = [{ key: "views", label: "Lượt xem" }] as const;

/**
 * The zone "Theo ngày" (spec 0025, AC-10 and AC-11), first thread: the views by day through the
 * shared chart and, one click away, the same days as a text table. The six tabs and the second
 * line come with the `lines` prop of the chart (M2).
 */
export function DailyChartZone({ overview }: { overview: AdminOverview }) {
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();
  const { period, series, engagement } = overview;

  return (
    <StatsZone title="Theo ngày">
      <TrendChart
        points={series.map((day) => ({ date: day.date, value: day.views }))}
        name="Lượt xem"
        unit="lượt xem"
        // The total is the `value` of the Metric, never a sum of the points.
        label={`Lượt xem theo ngày từ ${rangeText(period)}, tổng ${formatCount(engagement.views.value)} lượt xem`}
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
              caption={tableCaption(period)}
              columns={COLUMNS}
              rows={series}
            />
          )}
        </div>
      </div>
    </StatsZone>
  );
}
