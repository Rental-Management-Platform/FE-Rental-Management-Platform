"use client";

import { ListingCard } from "@/components/listing-card";
import { HeartButton } from "@/features/favorites/components/heart-button";
import {
  SavedEmpty,
  SavedFailure,
  SavedList,
  SavedSkeleton,
} from "@/features/favorites/components/saved-screen";
import type { HeartView } from "@/features/favorites/favorite-view";
import { createApiError, networkError } from "@/lib/api/errors";
import { authHref } from "@/lib/next-path";
import {
  SAVED_NONE,
  SAVED_PAGE,
  SAVED_PAST_END,
  SAVED_ROWS,
} from "./favorites-sample";
import { Labeled, Section } from "./section";

const PATH = "/phong-co-gac-gan-cho-tan-dinh-ab12cd34";
const SIGN_IN = authHref("/login", PATH);
const TITLE = "Phòng có gác gần chợ Tân Định";

const UNSAVED: HeartView = { kind: "ready", saved: false, canChange: true };
const SAVED: HeartView = { kind: "ready", saved: true, canChange: true };

type HeartCase = {
  label: string;
  view: HeartView;
  pending?: boolean;
  locked?: boolean;
  announcement?: string;
};

const HEART_CASES: readonly HeartCase[] = [
  {
    label: "checking · phiên đang tải, hoặc đang đọc cờ isFavorite",
    view: { kind: "checking" },
  },
  {
    label: "guest · tim rỗng dẫn tới đăng nhập, rồi quay lại trang này",
    view: { kind: "guest" },
  },
  { label: "ready · chưa lưu", view: UNSAVED },
  { label: "ready · đã lưu, tim đầy màu chính", view: SAVED },
  {
    label: "ready · đang gửi, khóa bằng aria-disabled nên focus ở lại nút",
    view: UNSAVED,
    pending: true,
    locked: true,
  },
  {
    label: "ready · đang đếm ngược sau lỗi 429, nút khóa",
    view: SAVED,
    locked: true,
  },
  {
    label: "ready · đã lưu nhưng không có favorite:delete, nút tắt",
    view: { kind: "ready", saved: true, canChange: false },
  },
  {
    label: "ready · vừa lưu xong, dòng thông báo cho trình đọc màn hình",
    view: SAVED,
    announcement: "Đã lưu tin.",
  },
  {
    label: "failed · đọc cờ lỗi hoặc trả null, bấm để đọc lại",
    view: { kind: "failed" },
  },
];

const SERVER_ERROR = createApiError({
  status: 500,
  code: "INTERNAL_ERROR",
  message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
  requestId: "7f3a2c91-4b1e",
});
const RATE_LIMITED = createApiError({
  status: 429,
  code: "RATE_LIMITED",
  message: "Bạn thao tác quá nhanh.",
  retryAfterSeconds: 45,
  retryAfterExact: true,
});

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

// The button never reads a session or the network here: every state comes from the views above.
function Heart({
  view,
  shape,
  pending = false,
  locked = false,
  announcement = "",
}: Omit<HeartCase, "label"> & { shape: "icon" | "labeled" }) {
  return (
    <HeartButton
      view={view}
      shape={shape}
      title={TITLE}
      pending={pending}
      locked={locked}
      announcement={announcement}
      signInHref={SIGN_IN}
      onToggle={() => undefined}
      onRetry={() => undefined}
    />
  );
}

// The heart of a listing (scope #14): the bare heart on a card, the heart with a word in the page
// header, the card with its heart slot, and the page "Tin đã lưu" in each of its states. The
// failures of a press are toasts, so they have no example here. A heart that is hidden for this
// viewer (an admin, a landlord) draws nothing, so it has no example either.
export function FavoritesSection() {
  return (
    <>
      <Section
        bare
        title="Nút tim: các trạng thái"
        description="Trên thẻ là một biểu tượng 44 px, tên nút không đổi ('Lưu tin: tiêu đề tin') và trạng thái nằm ở aria-pressed. Ở đầu trang chi tiết là nút có chữ, chữ đổi giữa 'Lưu tin' và 'Đã lưu' nên tên luôn khớp chữ trên nút. Đã lưu thì tim đầy, vừa đổi hình vừa đổi màu."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HEART_CASES.map(({ label, ...state }) => (
            <Labeled key={label} label={label}>
              <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
                <Heart shape="icon" {...state} />
                <Heart shape="labeled" {...state} />
              </div>
            </Labeled>
          ))}
        </div>
      </Section>

      <Section
        bare
        title="Thẻ tin có tim"
        description="Tim nằm bên phải tiêu đề, trên liên kết phủ cả thẻ, nên bấm tim không mở tin. Thẻ của trang Tin đã lưu thêm dòng 'Đã lưu ngày'. Với người không có tim (chủ trọ, admin) chỗ này không chiếm gì."
      >
        <div className="flex flex-col gap-6">
          <Labeled label="chưa lưu · đã lưu kèm dòng ngày lưu · tiêu đề rất dài">
            <ul className={GRID}>
              <li className="grid">
                <ListingCard
                  listing={SAVED_ROWS[0]}
                  href={PATH}
                  heart={<Heart shape="icon" view={UNSAVED} />}
                />
              </li>
              <li className="grid">
                <ListingCard
                  listing={SAVED_ROWS[2]}
                  href={PATH}
                  savedAt={SAVED_ROWS[2].favoritedAt}
                  heart={<Heart shape="icon" view={SAVED} />}
                />
              </li>
              <li className="grid">
                <ListingCard
                  listing={SAVED_ROWS[1]}
                  href={PATH}
                  savedAt={SAVED_ROWS[1].favoritedAt}
                  heart={<Heart shape="icon" view={SAVED} />}
                />
              </li>
            </ul>
          </Labeled>
          <Labeled label="đang kiểm tra cờ · khách">
            <ul className={GRID}>
              <li className="grid">
                <ListingCard
                  listing={SAVED_ROWS[0]}
                  href={PATH}
                  heart={<Heart shape="icon" view={{ kind: "checking" }} />}
                />
              </li>
              <li className="grid">
                <ListingCard
                  listing={SAVED_ROWS[2]}
                  href={PATH}
                  heart={<Heart shape="icon" view={{ kind: "guest" }} />}
                />
              </li>
            </ul>
          </Labeled>
        </div>
      </Section>

      <Section
        bare
        title="Trang Tin đã lưu"
        description="Các trạng thái của /favorites trên dữ liệu giả. Bấm tim ở đây không làm gì, vì thật thì nó bỏ lưu và thẻ biến đi. Số trong tiêu đề đổi theo và được đọc lên, rồi focus chuyển về tiêu đề vì nút vừa bấm đã mất."
      >
        <div className="flex flex-col gap-8">
          <Labeled label="có tin · 25 tin, trang 1 của 3">
            <SavedList
              data={SAVED_PAGE}
              renderHeart={() => <Heart shape="icon" view={SAVED} />}
            />
          </Labeled>
          <Labeled label="chưa lưu tin nào · nút Tìm trọ">
            <SavedEmpty />
          </Labeled>
          <Labeled label="trang quá số trang · nút Xem trang cuối">
            <SavedList
              data={SAVED_PAST_END}
              renderHeart={() => <Heart shape="icon" view={SAVED} />}
            />
          </Labeled>
          <Labeled label="đang tải · khung chờ">
            <SavedSkeleton />
          </Labeled>
          <Labeled label="đọc lỗi 500 · có mã hỗ trợ và nút Thử lại">
            <SavedFailure error={SERVER_ERROR} onRetry={() => undefined} />
          </Labeled>
          <Labeled label="đọc lỗi 429 · đếm ngược, Thử lại tắt cho tới khi hết">
            <SavedFailure error={RATE_LIMITED} onRetry={() => undefined} />
          </Labeled>
          <Labeled label="đọc lỗi mạng">
            <SavedFailure error={networkError()} onRetry={() => undefined} />
          </Labeled>
          <Labeled label="đã bỏ lưu hết (total 0 sau khi bỏ tin cuối)">
            <SavedList
              data={SAVED_NONE}
              renderHeart={() => <Heart shape="icon" view={SAVED} />}
            />
          </Labeled>
        </div>
      </Section>
    </>
  );
}
