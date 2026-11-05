import { ListingCard } from "@/components/listing-card";
import { ListingPhoto } from "@/components/listing-photo";
import { ListingsFailure } from "@/features/listing-search/components/listings-failure";
import type { ListingSummary } from "@/lib/api/types";
import { Labeled, Section } from "./section";

// A stand-in photo drawn in code, so the gallery makes no network call and ships no image file.
// It is picture content, not interface, so its colors are not design tokens.
const SAMPLE_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(200 55% 78%)"/>` +
    `<stop offset="1" stop-color="hsl(230 45% 52%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="300" fill="url(#g)"/>` +
    `<rect x="120" y="120" width="160" height="130" fill="hsl(200 30% 94%)"/>` +
    `<path d="M100 125 L200 60 L300 125 Z" fill="hsl(200 40% 36%)"/>` +
    `<rect x="185" y="175" width="30" height="75" fill="hsl(200 35% 40%)"/>` +
    `</svg>`,
)}`;

// Not a decodable image, so the browser raises its error event at once and with no request. That
// is what a photo of a hidden listing does on the real page, where the backend answers 404.
const UNLOADABLE = "data:image/png;base64,AAAA";

// A card takes a row of `GET /listings`. Every sample row has `coverImageUrl` null, because the
// card only accepts a path of the API's media folder and the gallery makes no network call. The
// photo states are shown on the photo box itself, below.
const BASE: ListingSummary = {
  id: "00000000-0000-4000-8000-000000000001",
  code: "AB12CD",
  slug: "phong-co-gac-gan-cho-tan-dinh",
  title: "Phòng có gác gần chợ Tân Định",
  price: 3500000,
  areaM2: 22.5,
  deposit: 3500000,
  availableFrom: "2026-11-15",
  coverImageUrl: null,
  ward: { code: "26734", name: "Phường Tân Định" },
  addressText: "12 Đặng Dung",
  fullAddress: "12 Đặng Dung, Phường Tân Định, Thành phố Hồ Chí Minh",
  landlord: {
    id: "00000000-0000-4000-8000-0000000000a1",
    name: "Nguyễn Thị Hồng",
  },
  createdAt: "2026-10-30T03:00:00.000Z",
};

const LONG: ListingSummary = {
  ...BASE,
  id: "00000000-0000-4000-8000-000000000002",
  title:
    "Căn hộ mini đầy đủ nội thất, có ban công thoáng, ngay mặt tiền đường Nguyễn Đình Chiểu, gần chợ, trường học và bến xe buýt",
  fullAddress:
    "Số 128/12/5 Hẻm 45 đường Nguyễn Đình Chiểu, Khu phố 3, Phường Võ Thị Sáu, Quận 3, Thành phố Hồ Chí Minh",
  landlord: {
    ...BASE.landlord,
    name: "Công ty trách nhiệm hữu hạn Quản lý nhà trọ Mái Hiên",
  },
};

const MINIMAL: ListingSummary = {
  ...BASE,
  id: "00000000-0000-4000-8000-000000000003",
  title: "Phòng đơn 15 m² cho sinh viên",
  price: 2800000,
  areaM2: 15,
  deposit: null,
  availableFrom: null,
  landlord: { ...BASE.landlord, name: null },
};

const GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

// The sample link goes to the sample detail screen, which needs no API: the real detail page
// (spec 0010) needs a listing code that exists.
const SAMPLE_HREF = "/dev/ui/screens/listing-detail";

function Cards({
  label,
  rows,
  href,
}: {
  label: string;
  rows: ListingSummary[];
  href?: string;
}) {
  return (
    <Labeled label={label}>
      <ul className={GRID}>
        {rows.map((row) => (
          <li key={row.id} className="grid">
            <ListingCard listing={row} href={href} />
          </li>
        ))}
      </ul>
    </Labeled>
  );
}

// A frame for one photo box state. The box is 16:9 and has no border of its own, so the card
// shape around it shows where it sits.
function PhotoSample({ label, src }: { label: string; src: string | null }) {
  return (
    <Labeled label={label}>
      <div className="overflow-hidden rounded-xl border bg-card">
        <ListingPhoto src={src} />
      </div>
    </Labeled>
  );
}

// The shared card of the list page (spec 0009) in its states, and the notice that replaces the
// list when it cannot be read. Fake rows, no network call.
export function ListingCardsSection() {
  return (
    <>
      <Section
        bare
        title="Thẻ tin"
        description="Thẻ đứng thẳng trên nền canvas, không nằm trong vùng nào. Không có href thì tiêu đề là chữ thường, thẻ không là liên kết, không phải điểm dừng Tab và không đổ bóng khi rê chuột. Có href thì tiêu đề là liên kết và một liên kết phủ cả thẻ."
      >
        <div className="flex flex-col gap-6">
          <Cards
            label="không có href (cách #8 dùng) · ảnh thay thế"
            rows={[BASE]}
          />
          <Cards
            label="có href · tiêu đề liên kết, rê chuột có bóng, Tab có vòng focus"
            rows={[BASE]}
            href={SAMPLE_HREF}
          />
          <Cards
            label="tiêu đề và địa chỉ dài (hai dòng rồi cắt) · tên chủ trọ dài"
            rows={[LONG, BASE, MINIMAL]}
          />
          <Cards
            label='không có tiền cọc, ngày vào ở và tên chủ trọ (hiện "Chủ trọ")'
            rows={[MINIMAL]}
          />
        </div>
      </Section>

      <Section
        title="Ô ảnh của thẻ tin"
        description="Ô 16:9 có ba trạng thái. Có ảnh thì hiện ảnh. Không có địa chỉ ảnh thì hiện khung thay thế. Ảnh tải lỗi thì ô ảnh biến mất, không có biểu tượng ảnh hỏng và không có thông báo lỗi. Ảnh đầu tiên của trang tải ngay, các ảnh khác tải khi cuộn tới."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PhotoSample label="src có ảnh" src={SAMPLE_PHOTO} />
          <PhotoSample label="src null · khung thay thế" src={null} />
          <PhotoSample
            label="ảnh tải lỗi · ô ảnh ẩn (khung này gần như trống)"
            src={UNLOADABLE}
          />
        </div>
      </Section>

      <Section
        title="Danh sách tin: không đọc được"
        description='Khi máy chủ không đọc được danh sách, khu kết quả đổi thành mục "Kết quả tìm kiếm" kèm thông báo, còn đầu trang và ô tìm kiếm vẫn dùng được. Lỗi 5xx hiện mã hỗ trợ. Lỗi 429 hiện thời gian chờ đếm ngược và nút "Thử lại" bị tắt cho tới khi hết.'
      >
        <div className="flex flex-col gap-6">
          <Labeled label="lỗi 500 · có mã hỗ trợ, nút Thử lại làm mới trang">
            <ListingsFailure
              status={500}
              code="INTERNAL_ERROR"
              message="Đã có lỗi xảy ra. Vui lòng thử lại sau."
              requestId="7f3a2c91-4b1e"
              retryAfterSeconds={null}
              retryAfterExact={false}
            />
          </Labeled>
          <Labeled label="lỗi 429 · chờ 30 giây từ Retry-After">
            <ListingsFailure
              status={429}
              code="RATE_LIMITED"
              message="Bạn thao tác quá nhanh."
              requestId={null}
              retryAfterSeconds={30}
              retryAfterExact
            />
          </Labeled>
        </div>
      </Section>
    </>
  );
}
