"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DateOnly } from "@/lib/api/types";
import { formatCount, formatDateOnly, formatDayMonth } from "@/lib/format";
import { TREND_CHART_HEIGHT } from "./trend-chart-height";
import { yAxisScale } from "./y-axis";

/** One day of the chart. */
export interface TrendPoint {
  date: DateOnly;
  value: number;
}

export interface TrendAreaChartProps {
  points: readonly TrendPoint[];
  /** The name of the series, "Lượt xem". */
  name: string;
  /** The unit word of the tooltip, "lượt xem": "16/11/2026: 70 lượt xem". */
  unit: string;
  /** What the chart is, for a screen reader: what it shows, the range and the total. */
  label: string;
}

// The chart reads its color from the `--color-value` variable that `ChartContainer` writes from
// this config, so the line is the `primary` token and never a raw color.
const CONFIG = {
  value: { label: "Số lượng", color: "var(--primary)" },
} satisfies ChartConfig;

// The day of the point under the tooltip. Recharts types the payload loosely, so it is read
// with a check instead of a cast.
const dayOf = (payload: unknown): DateOnly =>
  typeof payload === "object" &&
  payload !== null &&
  "date" in payload &&
  typeof payload.date === "string"
    ? payload.date
    : "";

/**
 * An area with a line, one point per day, no animation (spec 0024, AC-8). Recharts draws it, so
 * this file is loaded on its own by `TrendChart` and stays out of the first script of the page.
 * The keyboard moves over the days with the arrow keys (recharts' accessibility layer) and the
 * tooltip then says the full day and the count. A range of one day draws a dot, because an area
 * of one point is invisible.
 */
export function TrendAreaChart({
  points,
  name,
  unit,
  label,
}: TrendAreaChartProps) {
  const single = points.length === 1;
  // The largest point, not a sum: it only decides where the axis ends.
  const { top, ticks } = yAxisScale(Math.max(0, ...points.map((p) => p.value)));
  return (
    <ChartContainer
      config={CONFIG}
      className={`aspect-auto w-full ${TREND_CHART_HEIGHT}`}
    >
      <AreaChart
        data={points as TrendPoint[]}
        accessibilityLayer
        title={label}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={formatDayMonth}
        />
        <YAxis
          width={44}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          domain={[0, top]}
          ticks={ticks}
          interval={0}
          tickFormatter={formatCount}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              hideIndicator
              formatter={(value, _name, item) => (
                <span className="font-medium text-foreground">
                  {formatDateOnly(dayOf(item.payload))}:{" "}
                  {formatCount(Number(value))} {unit}
                </span>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          name={name}
          stroke="var(--color-value)"
          strokeWidth={2}
          fill="var(--color-value)"
          fillOpacity={0.12}
          isAnimationActive={false}
          dot={
            single
              ? { r: 4, fill: "var(--color-value)", stroke: "var(--card)" }
              : false
          }
          activeDot={{
            r: 4,
            fill: "var(--color-value)",
            stroke: "var(--card)",
          }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
