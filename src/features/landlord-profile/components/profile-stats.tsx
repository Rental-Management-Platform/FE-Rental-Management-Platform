import { Card, CardContent } from "@/components/ui/card";
import type { LandlordProfile } from "@/lib/api/types";
import { formatCount, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type StatFactsProps = Pick<
  LandlordProfile,
  "followerCount" | "publicListingCount" | "totalViewCount"
> & {
  /** The day they joined. Left out where the page already says it (the account page). */
  joinedAt?: LandlordProfile["joinedAt"];
};

/**
 * The numbers of a landlord as a list of facts: followers, listings now visible, total views and,
 * when it is given, the day they joined. It draws what it is given and owns no zone, so the public
 * profile page and the account page (scope #38) each put it in their own card and both read the
 * same words and the same format.
 */
export function StatFacts({
  followerCount,
  publicListingCount,
  totalViewCount,
  joinedAt,
}: StatFactsProps) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-4",
        joinedAt === undefined ? "sm:grid-cols-3" : "sm:grid-cols-4",
      )}
    >
      <Fact label="Người theo dõi" value={formatCount(followerCount)} />
      <Fact label="Tin đang hiện" value={formatCount(publicListingCount)} />
      <Fact label="Tổng lượt xem" value={formatCount(totalViewCount)} />
      {joinedAt !== undefined && (
        <Fact label="Tham gia từ" value={formatDateTime(joinedAt)} />
      )}
    </dl>
  );
}

type ProfileStatsProps = Pick<
  LandlordProfile,
  "followerCount" | "publicListingCount" | "totalViewCount" | "joinedAt"
>;

/**
 * The numbers zone of the public profile page. It draws what it is given, so the follow button can
 * change `followerCount` from the shared profile query and this zone follows.
 */
export function ProfileStats({
  followerCount,
  publicListingCount,
  totalViewCount,
  joinedAt,
}: ProfileStatsProps) {
  return (
    <Card>
      <CardContent>
        <h2 className="sr-only">Thông tin chủ trọ</h2>
        <StatFacts
          followerCount={followerCount}
          publicListingCount={publicListingCount}
          totalViewCount={totalViewCount}
          joinedAt={joinedAt}
        />
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
