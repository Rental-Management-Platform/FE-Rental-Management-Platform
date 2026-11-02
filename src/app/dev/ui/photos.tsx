"use client";

import { useId, type ReactNode } from "react";
import { toast } from "sonner";
import { PhotoTile } from "@/features/listing/components/photo-tile";
import {
  COVER_HELP,
  LAST_PHOTO_HELP,
} from "@/features/listing/schemas/photo-rules";
import { Labeled, Section } from "./section";

// A stand-in photo drawn in code, so the gallery makes no network call and ships no image file.
// It is picture content, not interface, so its colors are not design tokens.
const samplePhoto = (hue: number) => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 55% 78%)"/>` +
    `<stop offset="1" stop-color="hsl(${hue + 30} 45% 52%)"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="300" fill="url(#g)"/>` +
    `<rect x="120" y="120" width="160" height="130" fill="hsl(${hue} 30% 94%)"/>` +
    `<path d="M100 125 L200 60 L300 125 Z" fill="hsl(${hue} 40% 36%)"/>` +
    `<rect x="185" y="175" width="30" height="75" fill="hsl(${hue} 35% 40%)"/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const PHOTOS = [200, 30, 120, 280].map(samplePhoto);

// Not a decodable image, so the browser raises its error event at once and with no request. That
// is what a saved photo of a hidden listing does on the real page, where the backend answers 404.
const UNLOADABLE = "data:image/png;base64,AAAA";

const noop = () => undefined;
const demoAction = (what: string) => () =>
  toast(`${what}. Đây là bản mẫu, không gửi gì cả.`);

// The grid of the real zone: two tiles a row on a phone, then three.
const GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3";

// One tile with its state named above it. A tile is a list item, so each sits in a list of one.
function Sample({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Labeled label={label}>
      <ul>{children}</ul>
    </Labeled>
  );
}

function SavedPhotos() {
  const lastPhotoHelpId = useId();

  return (
    <Section
      title="Ảnh của tin: ảnh đã lưu"
      description="Ảnh đầu là ảnh bìa, nhãn nằm dưới ảnh trên nền đặc. Mỗi ảnh có nút xóa 44 px. Khi tin chỉ còn một ảnh, nút xóa tắt bằng aria-disabled nên vẫn nằm trong thứ tự Tab và đọc lý do ra; bấm vào đó không làm gì."
    >
      <div className="flex flex-col gap-6">
        <Labeled label='kind="saved" · ba ảnh, nút xóa bật'>
          <ul className={GRID}>
            {PHOTOS.slice(0, 3).map((src, index) => (
              <PhotoTile
                key={src}
                kind="saved"
                src={src}
                alt={`Ảnh ${index + 1} của tin`}
                isCover={index === 0}
                label={index === 0 ? "Ảnh bìa" : `Ảnh ${index + 1}`}
                photoId={`demo-${index}`}
                place={index + 1}
                canDelete
                deleteReasonId={undefined}
                onDelete={demoAction("Hộp xác nhận xóa sẽ mở ở đây")}
              />
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">{COVER_HELP}</p>
        </Labeled>

        <Labeled label='kind="saved" · chỉ còn một ảnh, nút xóa tắt có lý do'>
          <ul className={GRID}>
            <PhotoTile
              kind="saved"
              src={PHOTOS[3]}
              alt="Ảnh 1 của tin"
              isCover
              label="Ảnh bìa"
              photoId="demo-last"
              place={1}
              canDelete={false}
              deleteReasonId={lastPhotoHelpId}
              onDelete={noop}
            />
          </ul>
          <p id={lastPhotoHelpId} className="text-sm text-muted-foreground">
            {LAST_PHOTO_HELP}
          </p>
        </Labeled>
      </div>
    </Section>
  );
}

function UploadingPhotos() {
  return (
    <Section
      title="Ảnh của tin: ảnh đang gửi"
      description="Ảnh đi lần lượt từng tấm một. Mỗi trạng thái có chữ riêng, không bao giờ chỉ dựa vào màu. Ảnh chưa gửi được thì mờ đi một chút."
    >
      <div className={GRID}>
        <Sample label='kind="queued"'>
          <PhotoTile
            kind="queued"
            src={PHOTOS[0]}
            alt="Ảnh 3 của tin"
            fileName="phong-ngu.jpg"
            onRemove={demoAction("Ảnh sẽ rời hàng chờ")}
          />
        </Sample>
        <Sample label='kind="uploading"'>
          <PhotoTile
            kind="uploading"
            src={PHOTOS[1]}
            alt="Ảnh 4 của tin"
            fileName="ban-cong.jpg"
          />
        </Sample>
        <Sample label='kind="failed" · lời của backend, thử lại được'>
          <PhotoTile
            kind="failed"
            src={PHOTOS[2]}
            alt="Ảnh chưa tải: bep.jpg"
            fileName="bep.jpg"
            message="Máy chủ đang bận. Vui lòng thử lại sau."
            onRetry={demoAction("Ảnh sẽ được gửi lại")}
            retryDisabled={false}
            onRemove={demoAction("Ảnh sẽ bị bỏ")}
          />
        </Sample>
        <Sample label='kind="failed" · chưa gửi, hàng đợi đã dừng'>
          <PhotoTile
            kind="failed"
            src={PHOTOS[3]}
            alt="Ảnh chưa tải: nha-tam.jpg"
            fileName="nha-tam.jpg"
            message={null}
            onRetry={demoAction("Ảnh sẽ được gửi lại")}
            retryDisabled={false}
            onRemove={demoAction("Ảnh sẽ bị bỏ")}
          />
        </Sample>
        <Sample label='kind="failed" · "Thử lại" tắt lúc đếm ngược 429'>
          <PhotoTile
            kind="failed"
            src={PHOTOS[0]}
            alt="Ảnh chưa tải: san-thuong.jpg"
            fileName="san-thuong.jpg"
            message={null}
            onRetry={demoAction("Ảnh sẽ được gửi lại")}
            retryDisabled
            onRemove={demoAction("Ảnh sẽ bị bỏ")}
          />
        </Sample>
        <Sample label='kind="failed" · gửi lại cũng hỏng, chỉ còn "Bỏ"'>
          <PhotoTile
            kind="failed"
            src={PHOTOS[1]}
            alt="Ảnh chưa tải: anh-goc-lon.png"
            fileName="anh-goc-lon.png"
            message="Ảnh vượt quá dung lượng cho phép. Hãy chọn ảnh nhỏ hơn."
            onRetry={null}
            retryDisabled={false}
            onRemove={demoAction("Ảnh sẽ bị bỏ")}
          />
        </Sample>
      </div>
    </Section>
  );
}

function UnloadablePhotos() {
  return (
    <Section
      title="Ảnh của tin: ảnh không tải được"
      description="Backend chỉ phát ảnh khi tin đang công khai, và thẻ ảnh không mang token. Tin đang ẩn thì địa chỉ ảnh trả 404. Khi đó ô ảnh hiện bản chọn trên máy nếu có, không thì khung thay thế kèm lời giải thích. Không có thông báo lỗi, nút xóa vẫn dùng được."
    >
      <div className={GRID}>
        <Sample label="saved · địa chỉ lỗi, còn bản trên máy">
          <PhotoTile
            kind="saved"
            src={UNLOADABLE}
            alt="Ảnh 1 của tin"
            fallbackSrc={PHOTOS[0]}
            isCover
            label="Ảnh bìa"
            photoId="demo-local"
            place={1}
            canDelete
            deleteReasonId={undefined}
            onDelete={demoAction("Hộp xác nhận xóa sẽ mở ở đây")}
          />
        </Sample>
        <Sample label="saved · địa chỉ lỗi, không có bản trên máy">
          <PhotoTile
            kind="saved"
            src={UNLOADABLE}
            alt="Ảnh 2 của tin"
            isCover={false}
            label="Ảnh 2"
            photoId="demo-note"
            place={2}
            canDelete
            deleteReasonId={undefined}
            onDelete={demoAction("Hộp xác nhận xóa sẽ mở ở đây")}
          />
        </Sample>
        <Sample label="saved · không có địa chỉ ảnh (src null)">
          <PhotoTile
            kind="saved"
            src={null}
            alt="Ảnh 3 của tin"
            isCover={false}
            label="Ảnh 3"
            photoId="demo-null"
            place={3}
            canDelete
            deleteReasonId={undefined}
            onDelete={demoAction("Hộp xác nhận xóa sẽ mở ở đây")}
          />
        </Sample>
      </div>
    </Section>
  );
}

function PickedPhotos() {
  const markId = useId();

  return (
    <Section
      title="Ảnh của tin: ảnh chọn khi đăng tin"
      description="Cùng ô ảnh nhưng cho biểu mẫu đăng tin, lúc tin chưa có. Đổi thứ tự bằng hai nút mũi tên, ảnh đầu là ảnh bìa. Ảnh bị backend từ chối thì viền đỏ và có chữ."
    >
      <div className={GRID}>
        <Sample label='kind="picked" · ảnh bìa'>
          <PhotoTile
            kind="picked"
            src={PHOTOS[0]}
            alt="Ảnh 1 của tin"
            fileName="mat-tien.jpg"
            photoId="demo-picked-1"
            place={1}
            isCover
            label="Ảnh bìa"
            message={null}
            messageId={`${markId}-1`}
            canMoveUp={false}
            canMoveDown
            disabled={false}
            onMoveUp={noop}
            onMoveDown={demoAction("Ảnh sẽ lùi một chỗ")}
            onRemove={demoAction("Ảnh sẽ bị bỏ")}
          />
        </Sample>
        <Sample label='kind="picked" · bị backend từ chối'>
          <PhotoTile
            kind="picked"
            src={PHOTOS[1]}
            alt="Ảnh 2 của tin"
            fileName="ghi-chu.png"
            photoId="demo-picked-2"
            place={2}
            isCover={false}
            label="Ảnh 2"
            message="Tệp không phải ảnh JPEG, PNG hoặc WebP hợp lệ."
            messageId={`${markId}-2`}
            canMoveUp
            canMoveDown={false}
            disabled={false}
            onMoveUp={demoAction("Ảnh sẽ lên một chỗ")}
            onMoveDown={noop}
            onRemove={demoAction("Ảnh sẽ bị bỏ")}
          />
        </Sample>
        <Sample label='kind="picked" · đang gửi, nút tắt'>
          <PhotoTile
            kind="picked"
            src={PHOTOS[2]}
            alt="Ảnh 3 của tin"
            fileName="phong-tam.jpg"
            photoId="demo-picked-3"
            place={3}
            isCover={false}
            label="Ảnh 3"
            message={null}
            messageId={`${markId}-3`}
            canMoveUp
            canMoveDown
            disabled
            onMoveUp={noop}
            onMoveDown={noop}
            onRemove={noop}
          />
        </Sample>
      </div>
    </Section>
  );
}

// The tile of the listing photo zone (spec 0007) in every state, on fake data and with no
// network call. The same tile serves the zone and the picker of the post form.
export function PhotosSection() {
  return (
    <>
      <SavedPhotos />
      <UploadingPhotos />
      <UnloadablePhotos />
      <PickedPhotos />
    </>
  );
}
