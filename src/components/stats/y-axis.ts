// The Y axis of the daily chart (spec 0024, AC-8): it starts at 0, reaches at least 4, and has
// whole number ticks only, about five of them, at steps people read easily (1, 2, 5, 10, 20, 50...).
// Pure, so the rule can be read and tested without drawing a chart.

/** The axis never ends below this, so a range of all zeros still reads cleanly. */
export const Y_FLOOR = 4;

/** The most steps the axis is cut into, so at most six tick labels. */
const MAX_STEPS = 5;

const MULTIPLES = [1, 2, 5] as const;

/** The smallest of 1, 2, 5, 10, 20, 50... that cuts `max` into `MAX_STEPS` steps or fewer. */
function stepFor(max: number): number {
  for (let magnitude = 1; ; magnitude *= 10) {
    for (const multiple of MULTIPLES) {
      const step = multiple * magnitude;
      if (Math.ceil(max / step) <= MAX_STEPS) return step;
    }
  }
}

export interface YAxisScale {
  /** The top of the axis, a whole number step above or at the largest value. */
  top: number;
  /** 0, then every step up to `top`. */
  ticks: number[];
}

/** The ticks of the Y axis for the largest value in the series. */
export function yAxisScale(largest: number): YAxisScale {
  const max = Math.max(Y_FLOOR, Math.ceil(largest));
  const step = stepFor(max);
  const top = Math.ceil(max / step) * step;
  return {
    top,
    ticks: Array.from({ length: top / step + 1 }, (_, index) => index * step),
  };
}
