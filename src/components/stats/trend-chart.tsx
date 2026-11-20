"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TrendAreaChartProps } from "./trend-area-chart";
import { TREND_CHART_HEIGHT } from "./trend-chart-height";
import { lineStyle, type ChartLines } from "./trend-lines";

/** The loading look of the chart: the same fixed height, so nothing below it moves. */
export function TrendChartSkeleton() {
  return <Skeleton className={cn("w-full rounded-lg", TREND_CHART_HEIGHT)} />;
}

// Recharts is loaded on its own and only in the browser (`ssr: false`, which Next.js allows in a
// Client Component): the data only exists in the browser anyway, and the library stays out of the
// first script of the page. The skeleton has the height of the chart.
const LazyTrendAreaChart = dynamic(
  () => import("./trend-area-chart").then((module) => module.TrendAreaChart),
  { ssr: false, loading: () => <TrendChartSkeleton /> },
);

/**
 * The legend of a chart with two lines (spec 0025, AC-10): the name of each line with a sample of
 * its stroke, solid for the first and dashed for the second. It is drawn here, not by the chart
 * library, so it is there at once and the chart below it does not move when it loads.
 */
function TrendLegend({ lines }: { lines: ChartLines }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground">
      {lines.map((line, index) => {
        const style = lineStyle(index);
        return (
          <li key={line.key} className="flex items-center gap-2">
            <svg
              aria-hidden="true"
              width="24"
              height="8"
              viewBox="0 0 24 8"
              className="shrink-0"
            >
              <line
                x1="0"
                y1="4"
                x2="24"
                y2="4"
                stroke={style.color}
                strokeWidth="2"
                strokeDasharray={style.dash}
              />
            </svg>
            {line.name}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The daily chart of a statistics screen, with one or two lines. A chart with two lines shows its
 * legend above it.
 */
export function TrendChart(props: TrendAreaChartProps) {
  return (
    <div className="flex flex-col gap-3">
      {props.lines.length === 2 && <TrendLegend lines={props.lines} />}
      <LazyTrendAreaChart {...props} />
    </div>
  );
}
