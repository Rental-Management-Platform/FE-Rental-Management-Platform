import { useId, type ReactNode } from "react";
import { describeChange } from "@/components/stats/describe-change";
import { MetricCard } from "@/components/stats/metric-card";
import { previousLine } from "@/components/stats/stats-text";
import type { Metric, Statistics } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import { totalLine, VIEWS_SINCE_NOTE } from "../landlord-stats-text";

interface Card {
  label: string;
  metric: Metric;
  /** The number since the start, which has no period before and so no arrow. */
  total: number;
  /** One more quiet line, when the number needs a warning. */
  note?: ReactNode;
}

// The four number cards in screen order (spec 0024, AC-6). Every number is a field of the answer.
const cardsOf = ({ views, interest, chat }: Statistics): Card[] => [
  {
    label: "Lượt xem",
    metric: views.inRange,
    total: views.allTime,
    note: VIEWS_SINCE_NOTE,
  },
  {
    label: "Lượt lưu mới",
    metric: interest.newFavorites,
    total: interest.totalFavorites,
  },
  {
    label: "Người theo dõi mới",
    metric: interest.newFollowers,
    total: interest.totalFollowers,
  },
  {
    label: "Cuộc trò chuyện mới",
    metric: chat.conversationsOpened,
    total: chat.totalConversations,
  },
];

/**
 * The number cards right under the range bar (spec 0024, AC-6): each period number with how it
 * changed, the period before, and a quiet total since the start with no arrow. The change is the
 * percent the API worked out and nothing is divided here.
 */
export function PeriodCards({ statistics }: { statistics: Statistics }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="sr-only">
        Số liệu trong khoảng đã chọn
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cardsOf(statistics).map(({ label, metric, total, note }) => (
          <li key={label} className="min-w-0">
            <MetricCard
              label={label}
              value={formatCount(metric.value)}
              change={describeChange(metric)}
              lines={[
                previousLine(formatCount(metric.previous)),
                totalLine(formatCount(total)),
                ...(note === undefined ? [] : [note]),
              ]}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
