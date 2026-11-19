import { useId } from "react";
import { describeChange } from "@/components/stats/describe-change";
import { MetricCard } from "@/components/stats/metric-card";
import type { Statistics } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import {
  previousLine,
  totalLine,
  VIEWS_SINCE_NOTE,
} from "../landlord-stats-text";

/**
 * The number cards right under the range bar (spec 0024, AC-6): each period number with how it
 * changed, the period before, and a quiet total since the start with no arrow. Every number is a
 * field of the answer and the change is the percent the API worked out.
 */
export function PeriodCards({ statistics }: { statistics: Statistics }) {
  const headingId = useId();
  const { views } = statistics;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="sr-only">
        Số liệu trong khoảng đã chọn
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <li className="min-w-0">
          <MetricCard
            label="Lượt xem"
            value={formatCount(views.inRange.value)}
            change={describeChange(views.inRange)}
            lines={[
              previousLine(formatCount(views.inRange.previous)),
              totalLine(formatCount(views.allTime)),
              VIEWS_SINCE_NOTE,
            ]}
          />
        </li>
      </ul>
    </section>
  );
}
