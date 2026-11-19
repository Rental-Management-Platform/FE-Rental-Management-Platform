"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TREND_CHART_HEIGHT } from "./trend-chart-height";

/** The loading look of the chart: the same fixed height, so nothing below it moves. */
export function TrendChartSkeleton() {
  return <Skeleton className={cn("w-full rounded-lg", TREND_CHART_HEIGHT)} />;
}

/**
 * The daily chart of a statistics screen. Recharts is loaded on its own and only in the browser
 * (`ssr: false`, which Next.js allows in a Client Component): the data only exists in the browser
 * anyway, and the library stays out of the first script of the page. The skeleton has the height
 * of the chart.
 */
export const TrendChart = dynamic(
  () => import("./trend-area-chart").then((module) => module.TrendAreaChart),
  { ssr: false, loading: () => <TrendChartSkeleton /> },
);
