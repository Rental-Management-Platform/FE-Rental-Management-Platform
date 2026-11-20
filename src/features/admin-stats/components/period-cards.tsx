import { useId } from "react";
import { describeChange } from "@/components/stats/describe-change";
import { MetricCard } from "@/components/stats/metric-card";
import { previousLine } from "@/components/stats/stats-text";
import type { AdminOverview, Metric } from "@/lib/api/types";
import { formatCount } from "@/lib/format";
import {
  ENGAGEMENT_GROUP_NOTE,
  ENGAGEMENT_GROUP_TITLE,
  REGISTRATION_GROUP_TITLE,
  VIEWS_SINCE_NOTE,
} from "../admin-stats-text";

interface Card {
  label: string;
  metric: (overview: AdminOverview) => Metric;
  /** One more quiet line, when the number needs a warning. */
  note?: string;
}

interface CardGroup {
  /** The `h2` of the group. */
  title: string;
  /** A quiet line under the heading, for the whole group. */
  note?: string;
  cards: readonly Card[];
}

// The cards of the range in screen order (spec 0025, AC-9). Every number is a field of the answer
// and every percent was worked out by the API: nothing is divided or added here. The two review
// cards are two different things and are never added together.
const GROUPS: readonly CardGroup[] = [
  {
    title: REGISTRATION_GROUP_TITLE,
    cards: [
      {
        label: "Đăng ký mới",
        metric: ({ accounts }) => accounts.registered.total,
      },
      {
        label: "Chủ trọ mới",
        metric: ({ accounts }) => accounts.registered.landlords,
      },
      {
        label: "Người tìm trọ mới",
        metric: ({ accounts }) => accounts.registered.tenants,
      },
      { label: "Tin mới", metric: ({ listings }) => listings.created },
    ],
  },
  {
    title: ENGAGEMENT_GROUP_TITLE,
    note: ENGAGEMENT_GROUP_NOTE,
    cards: [
      {
        label: "Lượt xem",
        metric: ({ engagement }) => engagement.views,
        note: VIEWS_SINCE_NOTE,
      },
      {
        label: "Cuộc trò chuyện mới",
        metric: ({ engagement }) => engagement.conversations,
      },
      {
        label: "Tin nhắn mới",
        metric: ({ engagement }) => engagement.messages,
      },
      {
        label: "Đánh giá chủ trọ mới",
        metric: ({ engagement }) => engagement.landlordReviews,
      },
      {
        label: "Đánh giá phòng mới",
        metric: ({ engagement }) => engagement.roomReviews,
      },
      {
        label: "Lượt theo dõi mới",
        metric: ({ engagement }) => engagement.follows,
      },
      {
        label: "Lượt lưu mới",
        metric: ({ engagement }) => engagement.favorites,
      },
    ],
  },
];

function CardGroupView({
  group,
  overview,
}: {
  group: CardGroup;
  overview: AdminOverview;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-base font-semibold">
          {group.title}
        </h2>
        {group.note !== undefined && (
          <p className="text-sm text-muted-foreground">{group.note}</p>
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {group.cards.map(({ label, metric, note }) => {
          const value = metric(overview);
          return (
            <li key={label} className="min-w-0">
              <MetricCard
                label={label}
                value={formatCount(value.value)}
                change={describeChange(value)}
                lines={[
                  previousLine(formatCount(value.previous)),
                  ...(note === undefined ? [] : [note]),
                ]}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The number cards of the range, in two groups under the range bar (spec 0025, AC-9): each period
 * number with how it changed and the period before. No card shows a total since the start,
 * because the API gives none.
 */
export function PeriodCards({ overview }: { overview: AdminOverview }) {
  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => (
        <CardGroupView key={group.title} group={group} overview={overview} />
      ))}
    </div>
  );
}
