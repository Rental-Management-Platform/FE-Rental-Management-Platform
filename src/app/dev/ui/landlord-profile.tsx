"use client";

import { NotFoundState } from "@/components/states/not-found-state";
import { StarRating } from "@/components/star-rating";
import { FollowButton } from "@/features/landlord-profile/components/follow-button";
import { LandlordProfileSkeleton } from "@/features/landlord-profile/components/landlord-profile-skeleton";
import {
  NoListings,
  PastLastPage,
} from "@/features/landlord-profile/components/listings-states";
import { ProfileStats } from "@/features/landlord-profile/components/profile-stats";
import { RatingLine } from "@/features/reviews/components/rating-line";
import type { FollowView } from "@/features/landlord-profile/follow-view";
import { NOT_FOUND_TITLE } from "@/features/landlord-profile/text";
import { ListingsFailure } from "@/features/listing-search/components/listings-failure";
import { createApiError, networkError } from "@/lib/api/errors";
import { authHref } from "@/lib/next-path";
import { Labeled, Section } from "./section";

const PATH = "/chu-tro/0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8d01";

const GONE = createApiError({
  status: 404,
  code: "LANDLORD_NOT_FOUND",
  message: "Không tìm thấy chủ trọ.",
});
const DENIED = createApiError({
  status: 403,
  code: "PERMISSION_DENIED",
  message: "Không đủ quyền.",
});
const RATE_LIMITED = createApiError({
  status: 429,
  code: "RATE_LIMITED",
  message: "Bạn thao tác quá nhanh.",
  retryAfterSeconds: 45,
  retryAfterExact: true,
});
const SERVER_ERROR = createApiError({
  status: 500,
  code: "INTERNAL_ERROR",
  message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
  requestId: "7f3a2c91-4b1e",
});

const NOT_FOLLOWING: FollowView = {
  kind: "ready",
  following: false,
  canChange: true,
};
const FOLLOWING: FollowView = {
  kind: "ready",
  following: true,
  canChange: true,
};

type FollowCase = {
  label: string;
  view: FollowView;
  pending?: boolean;
  failure?: unknown;
  announcement?: string;
};

const FOLLOW_CASES: readonly FollowCase[] = [
  {
    label: "checking · phiên đang tải, hoặc đang đọc isFollowing",
    view: { kind: "checking" },
  },
  {
    label: "guest · nút Theo dõi dẫn tới đăng nhập, rồi quay lại hồ sơ",
    view: { kind: "guest" },
  },
  { label: "ready · chưa theo dõi, nút chính", view: NOT_FOLLOWING },
  { label: "ready · đang theo dõi, nút viền", view: FOLLOWING },
  {
    label: "ready · đang gửi, khóa bằng aria-disabled nên focus ở lại nút",
    view: NOT_FOLLOWING,
    pending: true,
  },
  {
    label: "ready · đang theo dõi nhưng không có follow:delete, nút tắt",
    view: { kind: "ready", following: true, canChange: false },
  },
  {
    label: "ready · vừa theo dõi xong, dòng thông báo cho trình đọc màn hình",
    view: FOLLOWING,
    announcement: "Đã theo dõi chủ trọ.",
  },
  {
    label: "bấm lỗi 404 · chủ trọ không còn, trang sẽ đọc lại hồ sơ",
    view: NOT_FOLLOWING,
    failure: GONE,
  },
  {
    label: "bấm lỗi 403 · không đủ quyền",
    view: NOT_FOLLOWING,
    failure: DENIED,
  },
  {
    label: "bấm lỗi 429 · đếm ngược, nút khóa cho tới khi hết",
    view: NOT_FOLLOWING,
    failure: RATE_LIMITED,
  },
  {
    label: "bấm lỗi mạng · nút dùng lại được, không tự gửi lại",
    view: NOT_FOLLOWING,
    failure: networkError(),
  },
  {
    label: "failed · đọc isFollowing lỗi 500, có Thử lại",
    view: { kind: "failed", reason: "error", error: SERVER_ERROR },
  },
  {
    label: "failed · đọc isFollowing lỗi 429, Thử lại tắt cho tới khi hết",
    view: { kind: "failed", reason: "error", error: RATE_LIMITED },
  },
  {
    label: "failed · đọc 404, chủ trọ không còn",
    view: { kind: "failed", reason: "gone", error: GONE },
  },
];

const RATING_VALUES = [0, 1, 2.5, 3, 4.3, 4.5, 5];

// The profile of a landlord (scope #15): the stars, the score line, the numbers zone, the follow
// button in all its states, the skeleton and the failure notices, drawn from the same pieces as
// the page, on fake data. The listings zone reads the API on the server, so only its two
// "nothing to show" states are drawn here. A button that is hidden for this viewer (an admin, a
// landlord, one's own profile) draws nothing, so it has no example.
export function LandlordProfileSection() {
  return (
    <>
      <Section
        title="Hồ sơ chủ trọ: sao và dòng điểm"
        description="StarRating chỉ để hiển thị: một ảnh có nhãn đọc là '4,3 trên 5 sao', các ngôi sao tô theo phần trăm nên điểm trung bình lẻ vẫn đúng. Dòng điểm không vẽ sao rỗng khi chưa có đánh giá."
      >
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {RATING_VALUES.map((value) => (
            <Labeled key={value} label={`value ${value}`}>
              <StarRating value={value} />
            </Labeled>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Labeled label="12 đánh giá, điểm 4,3">
            <RatingLine reviewCount={12} ratingAverage={4.3} />
          </Labeled>
          <Labeled label="1 đánh giá, điểm 5,0">
            <RatingLine reviewCount={1} ratingAverage={5} />
          </Labeled>
          <Labeled label="chưa có đánh giá">
            <RatingLine reviewCount={0} ratingAverage={null} />
          </Labeled>
        </div>
      </Section>

      <Section
        bare
        title="Hồ sơ chủ trọ: các con số"
        description="Một vùng trắng với bốn số: người theo dõi, tin đang hiện, tổng lượt xem và ngày tham gia. Số người theo dõi đổi ngay khi bấm Theo dõi, vì cùng đọc một truy vấn."
      >
        <ProfileStats
          followerCount={1280}
          publicListingCount={16}
          totalViewCount={13143}
          joinedAt="2026-04-16T03:00:00.000Z"
        />
      </Section>

      <Section
        bare
        title="Hồ sơ chủ trọ: nút theo dõi"
        description="Một nút, mười bốn trạng thái. Nút nằm bên phải tiêu đề từ md và dưới điểm sao trên điện thoại. Khi đang gửi hay đang đếm ngược 429, nút khóa bằng aria-disabled, không dùng disabled."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FOLLOW_CASES.map(
            ({
              label,
              view,
              pending = false,
              failure = null,
              announcement = "",
            }) => (
              <Labeled key={label} label={label}>
                <div className="rounded-xl border bg-card p-4">
                  <FollowButton
                    view={view}
                    pending={pending}
                    failure={failure}
                    announcement={announcement}
                    signInHref={authHref("/login", PATH)}
                    onToggle={() => undefined}
                    onRetry={() => undefined}
                  />
                </div>
              </Labeled>
            ),
          )}
        </div>
      </Section>

      <Section
        bare
        title="Hồ sơ chủ trọ: khung chờ, lỗi và không tìm thấy"
        description="Khung chờ có hình dạng của trang (đường dẫn, tên, dòng điểm, vùng số, thẻ tin) nên trang không nhảy khi nội dung tới. Danh sách tin có hai trạng thái trống: chủ trọ chưa có tin, và trang quá số trang. Chủ trọ không có hoặc đã bị khóa thì hiện màn không tìm thấy."
      >
        <div className="flex flex-col gap-8">
          <Labeled label="LandlordProfileSkeleton · khung chờ của cả trang">
            <div className="flex flex-col gap-6">
              <LandlordProfileSkeleton />
            </div>
          </Labeled>
          <Labeled label="chủ trọ chưa có tin nào đang hiện">
            <NoListings />
          </Labeled>
          <Labeled label="trang quá số trang · nút Xem trang cuối">
            <PastLastPage
              landlordId="0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8d01"
              lastPage={2}
            />
          </Labeled>
          <Labeled label="đọc hồ sơ lỗi 500 · tiêu đề khối là 'Không tải được hồ sơ chủ trọ'">
            <ListingsFailure
              status={500}
              code="INTERNAL_ERROR"
              message="Đã có lỗi xảy ra. Vui lòng thử lại sau."
              requestId="7f3a2c91-4b1e"
              retryAfterSeconds={null}
              retryAfterExact={false}
              title="Không tải được hồ sơ chủ trọ"
            />
          </Labeled>
          <Labeled label="không tìm thấy chủ trọ · màn của trang này">
            <div className="rounded-xl border bg-card">
              <NotFoundState
                title={NOT_FOUND_TITLE}
                backHref="/"
                backLabel="Xem các tin khác"
              />
            </div>
          </Labeled>
        </div>
      </Section>
    </>
  );
}
