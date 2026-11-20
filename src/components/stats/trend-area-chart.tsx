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
import {
  lineStyle,
  type ChartLine,
  type ChartLines,
  type TrendPoint,
} from "./trend-lines";
import { yAxisScale } from "./y-axis";

export interface TrendAreaChartProps {
  /** One row per day: the `date` and one number for each line, under its `key`. */
  points: readonly TrendPoint[];
  /** One or two lines. The first is `primary` on a light area, the second `info` and dashed. */
  lines: ChartLines;
  /** What the chart is, for a screen reader: what it shows, the range and the total of each line. */
  label: string;
}

// The number of a line on a day. Rows are loosely typed (any line key), so a field that is not a
// number reads as 0 instead of being cast.
const valueOf = (point: TrendPoint, key: string): number => {
  const value = point[key];
  return typeof value === "number" ? value : 0;
};

// The day of the point under the tooltip. Recharts types the payload loosely, so it is read
// with a check instead of a cast.
const dayOf = (payload: unknown): DateOnly =>
  typeof payload === "object" &&
  payload !== null &&
  "date" in payload &&
  typeof payload.date === "string"
    ? payload.date
    : "";

// The chart reads each color from the `--color-<key>` variable that `ChartContainer` writes from
// this config, so a line is a token and never a raw color.
const configOf = (lines: readonly ChartLine[]): ChartConfig =>
  Object.fromEntries(
    lines.map((line, index) => [
      line.key,
      { label: line.name, color: lineStyle(index).color },
    ]),
  );

/**
 * One or two lines, one point per day, no animation (spec 0024, AC-8, and spec 0025, AC-10). The
 * first line has a light area under it; the second is dashed with no area. Both share one scale
 * that starts at 0 and is set by the larger line. Recharts draws it, so this file is loaded on its
 * own by `TrendChart` and stays out of the first script of the page. The keyboard moves over the
 * days with the arrow keys (recharts' accessibility layer) and the tooltip then says the full day
 * and the count of each line. A range of one day draws a dot per line, because an area or a line
 * of one point is invisible.
 */
export function TrendAreaChart({ points, lines, label }: TrendAreaChartProps) {
  const drawn: readonly ChartLine[] = lines;
  const single = points.length === 1;
  // The largest point of either line, not a sum: it only decides where the axis ends.
  const { top, ticks } = yAxisScale(
    Math.max(
      0,
      ...points.flatMap((point) =>
        drawn.map((line) => valueOf(point, line.key)),
      ),
    ),
  );
  return (
    <ChartContainer
      config={configOf(drawn)}
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
            lines.length === 1 ? (
              <ChartTooltipContent
                hideLabel
                hideIndicator
                formatter={(value, _name, item) => (
                  <span className="font-medium text-foreground">
                    {formatDateOnly(dayOf(item.payload))}:{" "}
                    {formatCount(Number(value))} {lines[0].unit}
                  </span>
                )}
              />
            ) : (
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(_label, payload) =>
                  formatDateOnly(dayOf(payload[0]?.payload))
                }
                formatter={(value, name) => (
                  <span className="font-medium text-foreground">
                    {name}: {formatCount(Number(value))}
                  </span>
                )}
              />
            )
          }
        />
        {drawn.map((line, index) => {
          const style = lineStyle(index);
          const color = `var(--color-${line.key})`;
          return (
            <Area
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={style.dash}
              fill={style.area ? color : "none"}
              fillOpacity={style.area ? 0.12 : 0}
              isAnimationActive={false}
              dot={
                single ? { r: 4, fill: color, stroke: "var(--card)" } : false
              }
              activeDot={{ r: 4, fill: color, stroke: "var(--card)" }}
            />
          );
        })}
      </AreaChart>
    </ChartContainer>
  );
}
