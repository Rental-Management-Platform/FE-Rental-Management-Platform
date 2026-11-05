"use client";

import { NotFoundState } from "@/components/states/not-found-state";
import { ContactPanel } from "@/features/listing-detail/components/contact-panel";
import type { ContactView } from "@/features/listing-detail/components/contact-view";
import {
  ListingGallery,
  type GalleryPhoto,
} from "@/features/listing-detail/components/listing-gallery";
import { ListingDetailSkeleton } from "@/features/listing-detail/components/listing-detail-skeleton";
import { ListingsFailure } from "@/features/listing-search/components/listings-failure";
import { createApiError } from "@/lib/api/errors";
import { authHref } from "@/lib/next-path";
import { Labeled, Section } from "./section";

// A stand-in photo drawn in code, so the gallery makes no network call and ships no image file.
// It is picture content, not interface, so its colors are not design tokens. Each hue gives a
// photo that looks different, so a swipe or a thumbnail click is easy to see.
const photo = (id: string, hue: number): GalleryPhoto => ({
  id,
  src: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">` +
      `<rect width="400" height="300" fill="hsl(${hue} 45% 62%)"/>` +
      `<rect x="120" y="120" width="160" height="130" fill="hsl(${hue} 30% 94%)"/>` +
      `<path d="M100 125 L200 60 L300 125 Z" fill="hsl(${hue} 40% 34%)"/>` +
      `<rect x="185" y="175" width="30" height="75" fill="hsl(${hue} 35% 40%)"/>` +
      `</svg>`,
  )}`,
});

// Not a decodable image, so the browser raises its error event at once and with no request. That
// is what a photo of a hidden listing does on the real page, where the backend answers 404.
const UNLOADABLE: GalleryPhoto = {
  id: "unloadable",
  src: "data:image/png;base64,AAAA",
};

const THREE = [photo("a", 200), photo("b", 28), photo("c", 340)];
const FIVE = [...THREE, photo("d", 120), photo("e", 270)];

const TITLE = "Phòng có gác gần chợ Tân Định";

const RATE_LIMITED = createApiError({
  status: 429,
  code: "RATE_LIMITED",
  message: "Bạn thao tác quá nhanh.",
  retryAfterSeconds: 30,
  retryAfterExact: true,
});

const SERVER_ERROR = createApiError({
  status: 500,
  code: "INTERNAL_ERROR",
  message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
  requestId: "7f3a2c91-4b1e",
});

const PATH = "/phong-co-gac-gan-cho-tan-dinh-k7m2xq9p";

const CONTACT_VIEWS: readonly { label: string; view: ContactView }[] = [
  {
    label: "checking · phiên đang tải, hoặc đang đọc số điện thoại",
    view: { kind: "checking" },
  },
  {
    label: "guest · nút đăng nhập, liên kết đăng ký, lý do",
    view: { kind: "guest" },
  },
  {
    label: "ready · nút gọi với số định dạng, khi gọi nói đã thấy tin",
    view: { kind: "ready", phone: "0901234501" },
  },
  { label: "own · tin của chính người xem", view: { kind: "own" } },
  {
    label: "failed no-phone · trả về nhưng số là null",
    view: { kind: "failed", reason: "no-phone" },
  },
  {
    label: "failed gone · tin vừa bị ẩn hoặc xóa (404)",
    view: { kind: "failed", reason: "gone" },
  },
  {
    label: "failed error 429 · đếm ngược, Thử lại tắt cho tới khi hết",
    view: { kind: "failed", reason: "error", error: RATE_LIMITED },
  },
  {
    label: "failed error 500 · có mã hỗ trợ",
    view: { kind: "failed", reason: "error", error: SERVER_ERROR },
  },
];

// The page column is 728 px wide from `lg`, and the contact column is 22 rem.
function PageColumn({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl">{children}</div>;
}

// The listing page (spec 0010): its gallery, contact card, skeleton and failure notices, drawn
// from the same pieces as the page, on fake data. The only requests are the ones the browser
// makes for the stand in photos, and none of them leave the page.
export function ListingDetailSection() {
  return (
    <>
      <Section
        bare
        title="Trang chi tiết tin: thư viện ảnh"
        description="Đứng trên nền canvas, không nằm trong vùng nào. Một ảnh thì chỉ có ảnh. Từ hai đến năm ảnh thì lướt bằng CSS scroll snap, có dải ảnh nhỏ và bộ đếm. Ảnh luôn hiện cả tấm, không bị cắt. Ảnh tải lỗi rời khỏi thư viện và bộ đếm đi theo; nếu mọi ảnh đều lỗi thì cả khu biến mất."
      >
        <div className="flex flex-col gap-8">
          <Labeled label="0 ảnh · khung thay thế và một dòng giải thích">
            <PageColumn>
              <ListingGallery title={TITLE} photos={[]} />
            </PageColumn>
          </Labeled>
          <Labeled label="1 ảnh · chỉ có ảnh, không dải ảnh nhỏ, không bộ đếm">
            <PageColumn>
              <ListingGallery title={TITLE} photos={[THREE[0]]} />
            </PageColumn>
          </Labeled>
          <Labeled label="3 ảnh · lướt, dải ảnh nhỏ, bộ đếm (bấm ảnh nhỏ để nhảy tới ảnh)">
            <PageColumn>
              <ListingGallery title={TITLE} photos={THREE} />
            </PageColumn>
          </Labeled>
          <Labeled label="5 ảnh · dải ảnh nhỏ cuộn ngang khi hẹp">
            <PageColumn>
              <ListingGallery title={TITLE} photos={FIVE} />
            </PageColumn>
          </Labeled>
          <Labeled label="3 ảnh, ảnh thứ hai tải lỗi · còn 2 ảnh, bộ đếm là 1/2">
            <PageColumn>
              <ListingGallery
                title={TITLE}
                photos={[THREE[0], UNLOADABLE, THREE[2]]}
              />
            </PageColumn>
          </Labeled>
          <Labeled label="mọi ảnh tải lỗi · cả khu biến mất, khung dưới đây gần như trống">
            <PageColumn>
              <ListingGallery title={TITLE} photos={[UNLOADABLE]} />
            </PageColumn>
          </Labeled>
        </div>
      </Section>

      <Section
        bare
        title="Trang chi tiết tin: thẻ liên hệ"
        description="Một thẻ, tám trạng thái. Số điện thoại chỉ có ở trạng thái ready và không bao giờ nằm trong HTML của máy chủ. Vùng nội dung là vùng thông báo lịch sự, để người đọc màn hình nghe số xuất hiện."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CONTACT_VIEWS.map(({ label, view }) => (
            <Labeled key={label} label={label}>
              <ContactPanel
                view={view}
                landlordName="Nguyễn Thị Hồng"
                postedAt="30/10/2026"
                signInHref={authHref("/login", PATH)}
                registerHref={authHref("/register", PATH)}
                onRetry={() => undefined}
              />
            </Labeled>
          ))}
        </div>
      </Section>

      <Section
        bare
        title="Trang chi tiết tin: khung chờ, lỗi và tin không còn"
        description="Khung chờ giữ đúng các ô của trang (ảnh 4:3, tiêu đề, ô giá và thông tin, thẻ liên hệ bên phải từ lg) nên trang không nhảy khi nội dung tới. Khi máy chủ không đọc được tin, trang hiện tiêu đề h1 và khối thông báo; tin không còn thì hiện màn không tìm thấy."
      >
        <div className="flex flex-col gap-8">
          <Labeled label="ListingDetailSkeleton · khung chờ của cả trang">
            <ListingDetailSkeleton />
          </Labeled>
          <Labeled label="đọc tin lỗi 500 · tiêu đề khối là 'Không tải được tin này'">
            <ListingsFailure
              status={500}
              code="INTERNAL_ERROR"
              message="Đã có lỗi xảy ra. Vui lòng thử lại sau."
              requestId="7f3a2c91-4b1e"
              retryAfterSeconds={null}
              retryAfterExact={false}
              title="Không tải được tin này"
            />
          </Labeled>
          <Labeled label="tin không còn · màn không tìm thấy của trang này">
            <div className="rounded-xl border bg-card">
              <NotFoundState
                title="Không tìm thấy tin này"
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
