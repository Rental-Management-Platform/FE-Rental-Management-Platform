import { Card, CardContent } from "@/components/ui/card";
import type { LandlordProfile } from "@/lib/api/types";
import { formatCount, formatDateTime } from "@/lib/format";

type ProfileStatsProps = Pick<
  LandlordProfile,
  "followerCount" | "publicListingCount" | "totalViewCount" | "joinedAt"
>;

/**
 * The numbers of a landlord, in one zone: followers, listings now visible, total views and the
 * day they joined. It draws what it is given, so the follow button can change `followerCount`
 * from the shared profile query and this zone follows.
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
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fact label="Người theo dõi" value={formatCount(followerCount)} />
          <Fact label="Tin đang hiện" value={formatCount(publicListingCount)} />
          <Fact label="Tổng lượt xem" value={formatCount(totalViewCount)} />
          <Fact label="Tham gia từ" value={formatDateTime(joinedAt)} />
        </dl>
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
