"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChatEntryControl } from "@/features/chat/components/chat-entry-control";
import { FirstMessageDialogView } from "@/features/chat/components/first-message-dialog";
import { useComposer } from "@/features/chat/hooks/use-composer";
import { ListingHintFrame } from "@/features/listing-reviews/components/listing-hint";
import { classifyListingReview } from "@/features/listing-reviews/review-errors";
import {
  LISTING_GUEST_LABEL,
  LISTING_REVIEWS_HEADING,
} from "@/features/listing-reviews/texts";
import { RatingLine } from "@/features/reviews/components/rating-line";
import { ReviewListArea } from "@/features/reviews/components/review-list-area";
import { ReviewsZoneFrame } from "@/features/reviews/components/reviews-zone-frame";
import {
  ReviewsZoneSkeleton,
  WriteBlockSkeleton,
} from "@/features/reviews/components/reviews-zone-skeleton";
import {
  GuestRowView,
  MineFailure,
} from "@/features/reviews/components/write-block";
import { createApiError, networkError } from "@/lib/api/errors";
import { authHref } from "@/lib/next-path";
import {
  Block,
  DialogSample,
  FormSample,
  Grid,
  INVALID,
  ListStateSample,
  PagedSample,
  PinnedSample,
  RATE_LIMITED,
  RATE_LIMITED_LONG,
  RoleSample,
  SERVER_ERROR,
  wait,
  type PreviewKit,
} from "./reviews";
import {
  pageOf,
  SAMPLE_CONVERSATION_ID,
  SAMPLE_LISTING,
  SAMPLE_LISTING_PATH,
  SAMPLE_MY_ROOM_REVIEW,
  SAMPLE_MY_ROOM_REVIEW_HIDDEN,
  SAMPLE_REVIEWS,
  SAMPLE_REVIEWS_ONLY_MINE_LAST,
  SAMPLE_TOO_LONG_COMMENT,
} from "./reviews-sample";
import { Labeled, Section } from "./section";

const LANDLORD_NAME = "Nguyễn Hữu Phát";
// A fixed average for the fake lists: the block never computes one, the backend does.
const ROOM_AVERAGE = 4.2;

// The score line the block draws under its heading, for a count (spec 0014, AC-3).
const scoreLine = (count: number, average: number | null) => (
  <p className="text-sm text-muted-foreground">
    <RatingLine reviewCount={count} ratingAverage={average} />
  </p>
);

const ROOM_KIT: PreviewKit = {
  heading: LISTING_REVIEWS_HEADING,
  summary: (count) =>
    count === null ? null : scoreLine(count, count === 0 ? null : ROOM_AVERAGE),
  classify: classifyListingReview,
};

// Made once, outside the components: a countdown is keyed on the identity of the error object.
const ALREADY_EXISTS = createApiError({
  status: 409,
  code: "LISTING_REVIEW_ALREADY_EXISTS",
  message: "Bạn đã đánh giá phòng này rồi.",
});
const NOT_ELIGIBLE = createApiError({
  status: 403,
  code: "LISTING_REVIEW_NOT_ELIGIBLE",
  message:
    "Bạn chỉ đánh giá được phòng của tin mà chủ trọ đã trả lời tin nhắn của bạn.",
});
const LISTING_GONE = createApiError({
  status: 404,
  code: "LISTING_NOT_FOUND",
  message: "Không tìm thấy tin.",
});

const HINT_LISTING = SAMPLE_LISTING;

// The hint with the first message button. The button opens the same dialog as the contact card,
// here with a fake send.
function HintNewSample() {
  const composer = useComposer("open");
  const [open, setOpen] = useState(false);
  return (
    <ListingHintFrame>
      {(describedBy) => (
        <FirstMessageDialogView
          open={open}
          onOpenChange={setOpen}
          composer={composer}
          onSend={() =>
            wait(600).then(() => {
              setOpen(false);
              toast("Đã gửi (giả)");
            })
          }
          listingTitle={HINT_LISTING.title}
          landlordName={LANDLORD_NAME}
          describedBy={describedBy}
        />
      )}
    </ListingHintFrame>
  );
}

// The hint with the control of the entry given: the real `ChatEntryControl`, which draws a link or a
// skeleton from its props alone.
function HintControlSample({
  entry,
}: {
  entry: Parameters<typeof ChatEntryControl>[0]["entry"];
}) {
  return (
    <ListingHintFrame>
      {(describedBy) => (
        <ChatEntryControl
          entry={entry}
          listing={HINT_LISTING}
          landlordName={LANDLORD_NAME}
          basePath="/tin-nhan"
          describedBy={describedBy}
        />
      )}
    </ListingHintFrame>
  );
}

// A frame with the score line of a room and a few rows (or none), as the block draws it.
function ScoreSample({
  reviewCount,
  ratingAverage,
}: {
  reviewCount: number;
  ratingAverage: number | null;
}) {
  const rows = SAMPLE_REVIEWS.slice(0, Math.min(reviewCount, 3));
  return (
    <ReviewsZoneFrame
      heading={LISTING_REVIEWS_HEADING}
      summary={scoreLine(reviewCount, ratingAverage)}
      announcement=""
    >
      <ReviewListArea
        loading={false}
        list={pageOf(rows, 1)}
        error={null}
        busy={false}
        page={1}
        total={rows.length}
        onPageChange={() => undefined}
        onRetry={() => undefined}
      />
    </ReviewsZoneFrame>
  );
}

// The room reviews block of the listing page on fake data, with no session and no network (spec
// 0014, AC-23). The pieces are the shared ones of `src/features/reviews`, the same ones the landlord
// zone uses, so a change to one shows in both previews. The block itself reads the address, the
// session and the API, so it is drawn from its parts: the frame, the write block in each state, the
// hint with its message button, the pinned card, the form, the dialog and the list area.
export function ListingReviewsSection() {
  return (
    <>
      <Section
        bare
        title="Đánh giá phòng: khối theo người xem"
        description="Cùng một khối, năm người xem. Khách thấy một dòng mời đăng nhập. Chủ trọ (kể cả chủ của tin) và admin chỉ đọc, không có khối viết và không gọi API đánh giá của mình. Người tìm trọ chưa đủ điều kiện thấy lời gợi ý kèm nút nhắn của chức năng nhắn tin (nút nhắn đầu tiên, liên kết “Xem tin nhắn của bạn”, hoặc khung chờ khi đang tra). Khối viết có khung chờ cùng hai kiểu lỗi đọc."
      >
        <Grid>
          <Labeled label="khách · dòng mời đăng nhập, quay lại đúng trang">
            <RoleSample
              kit={ROOM_KIT}
              block={
                <GuestRowView
                  href={authHref("/login", SAMPLE_LISTING_PATH)}
                  label={LISTING_GUEST_LABEL}
                />
              }
            />
          </Labeled>
          <Labeled label="chủ trọ hoặc admin · không có khối viết">
            <RoleSample kit={ROOM_KIT} block={null} />
          </Labeled>
          <Labeled label="chưa đủ điều kiện · chưa nhắn về tin này (nút nhắn đầu tiên)">
            <RoleSample
              kit={ROOM_KIT}
              block={
                <Block>
                  <HintNewSample />
                </Block>
              }
            />
          </Labeled>
          <Labeled label="chưa đủ điều kiện · đã có cuộc trò chuyện (liên kết)">
            <RoleSample
              kit={ROOM_KIT}
              block={
                <Block>
                  <HintControlSample
                    entry={{
                      kind: "existing",
                      conversationId: SAMPLE_CONVERSATION_ID,
                    }}
                  />
                </Block>
              }
            />
          </Labeled>
          <Labeled label="chưa đủ điều kiện · đang tra cuộc trò chuyện (khung chờ)">
            <RoleSample
              kit={ROOM_KIT}
              block={
                <Block>
                  <HintControlSample entry={{ kind: "checking" }} />
                </Block>
              }
            />
          </Labeled>
          <Labeled label="người tìm trọ · đang kiểm tra trạng thái">
            <RoleSample kit={ROOM_KIT} block={<WriteBlockSkeleton />} />
          </Labeled>
          <Labeled label="không tải được trạng thái · lỗi 500">
            <RoleSample
              kit={ROOM_KIT}
              block={
                <MineFailure error={SERVER_ERROR} onRetry={() => undefined} />
              }
            />
          </Labeled>
          <Labeled label="không tải được trạng thái · 429 đếm ngược">
            <RoleSample
              kit={ROOM_KIT}
              block={
                <MineFailure
                  error={RATE_LIMITED_LONG}
                  onRetry={() => undefined}
                />
              }
            />
          </Labeled>
        </Grid>
      </Section>

      <Section
        bare
        title="Đánh giá phòng: dòng điểm"
        description="Dưới tiêu đề là sao và “4,2 (12 đánh giá)”, hoặc chỉ “Chưa có đánh giá” khi chưa ai đánh giá (không bao giờ hiện 0 sao). Hai con số đến từ lần đọc chi tiết tin, không tính từ danh sách. Hai khung chờ cuối là phần nằm trong HTML từ máy chủ: tiêu đề thật và dòng điểm thật, chưa có chữ đánh giá nào."
      >
        <Grid>
          <Labeled label="12 đánh giá · 4,2">
            <ScoreSample reviewCount={12} ratingAverage={4.2} />
          </Labeled>
          <Labeled label="1 đánh giá · 5,0 (một đánh giá đứng riêng)">
            <ScoreSample reviewCount={1} ratingAverage={5} />
          </Labeled>
          <Labeled label="chưa có đánh giá · không có sao">
            <ScoreSample reviewCount={0} ratingAverage={null} />
          </Labeled>
          <Labeled label="khung chờ trong HTML máy chủ · có điểm">
            <ReviewsZoneSkeleton
              heading={LISTING_REVIEWS_HEADING}
              reviewCount={12}
              ratingAverage={4.2}
            />
          </Labeled>
          <Labeled label="khung chờ trong HTML máy chủ · chưa có đánh giá">
            <ReviewsZoneSkeleton
              heading={LISTING_REVIEWS_HEADING}
              reviewCount={0}
              ratingAverage={null}
            />
          </Labeled>
        </Grid>
      </Section>

      <Section
        bare
        title="Đánh giá phòng: biểu mẫu viết đánh giá"
        description="Các ô sao là một nhóm radio: Tab vào nhóm một lần, phím mũi tên đổi số sao. Bản nháp luôn còn nguyên sau mọi lỗi. Ba ô đầu cần bấm: bấm Đăng đánh giá khi chưa chọn sao để thấy lời nhắc, bấm ở ô có sẵn dữ liệu để thấy lỗi 400 nằm dưới từng ô, và bấm ở ô cuối để gửi giả thành công. Các ô còn lại đã có lỗi ngay từ đầu, với lời của đánh giá phòng."
      >
        <Grid>
          <Labeled label="trống · chưa chọn sao, bấm Đăng đánh giá">
            <FormSample kit={ROOM_KIT} />
          </Labeled>
          <Labeled label="lỗi 400 về từng ô · bấm Đăng đánh giá">
            <FormSample
              kit={ROOM_KIT}
              stars={4}
              comment="Nhận xét có sẵn"
              rejectWith={INVALID}
            />
          </Labeled>
          <Labeled label="gửi giả thành công · bấm Đăng đánh giá">
            <FormSample
              kit={ROOM_KIT}
              stars={4}
              comment="Phòng sạch, máy lạnh mát."
            />
          </Labeled>
          <Labeled label="nhận xét quá 1000 ký tự · nút tắt, số đếm đỏ">
            <FormSample
              kit={ROOM_KIT}
              stars={3}
              comment={SAMPLE_TOO_LONG_COMMENT}
            />
          </Labeled>
          <Labeled label="409 đã đánh giá phòng này rồi (LISTING_REVIEW_ALREADY_EXISTS)">
            <FormSample
              kit={ROOM_KIT}
              stars={5}
              comment="Phòng đúng như ảnh."
              seed={ALREADY_EXISTS}
            />
          </Labeled>
          <Labeled label="403 chưa đủ điều kiện (LISTING_REVIEW_NOT_ELIGIBLE)">
            <FormSample kit={ROOM_KIT} stars={5} seed={NOT_ELIGIBLE} />
          </Labeled>
          <Labeled label="429 đếm ngược · nút tắt cho tới khi hết">
            <FormSample kit={ROOM_KIT} stars={4} seed={RATE_LIMITED_LONG} />
          </Labeled>
          <Labeled label="lỗi 500 · có mã hỗ trợ">
            <FormSample
              kit={ROOM_KIT}
              stars={2}
              comment="Bản nháp còn nguyên."
              seed={SERVER_ERROR}
            />
          </Labeled>
          <Labeled label="lỗi mạng · nút dùng lại được, không tự gửi lại">
            <FormSample kit={ROOM_KIT} stars={4} seed={networkError()} />
          </Labeled>
          <Labeled label="tin không còn (LISTING_NOT_FOUND) · “Tin này không còn.”">
            <FormSample kit={ROOM_KIT} stars={4} seed={LISTING_GONE} />
          </Labeled>
        </Grid>
      </Section>

      <Section
        bare
        title="Đánh giá phòng: đánh giá của bạn, sửa và xóa"
        description="Thẻ ghim là nơi duy nhất có Sửa và Xóa. Bấm Sửa để mở biểu mẫu sửa (Hủy bỏ bản nháp), bấm Xóa để mở hộp thoại: nút Giữ lại nhận focus đầu tiên và bấm ra ngoài không đóng. Khi quản trị viên đã ẩn đánh giá, thẻ nói rõ bằng chữ, hiện lý do và chỉ còn nút Xóa."
      >
        <Grid>
          <Labeled label="đánh giá đang hiện · Sửa và Xóa">
            <PinnedSample kit={ROOM_KIT} review={SAMPLE_MY_ROOM_REVIEW} />
          </Labeled>
          <Labeled label="bị quản trị viên ẩn · chỉ còn Xóa, có lý do">
            <PinnedSample
              kit={ROOM_KIT}
              review={SAMPLE_MY_ROOM_REVIEW_HIDDEN}
            />
          </Labeled>
        </Grid>
        <div className="flex flex-wrap gap-6">
          <Labeled label="hộp thoại xóa · bình thường">
            <DialogSample kit={ROOM_KIT} failure={null} />
          </Labeled>
          <Labeled label="hộp thoại xóa · 429 đếm ngược">
            <DialogSample kit={ROOM_KIT} failure={RATE_LIMITED} />
          </Labeled>
          <Labeled label="hộp thoại xóa · lỗi mạng">
            <DialogSample kit={ROOM_KIT} failure={networkError()} />
          </Labeled>
          <Labeled label="hộp thoại xóa · tin không còn">
            <DialogSample kit={ROOM_KIT} failure={LISTING_GONE} />
          </Labeled>
        </div>
      </Section>

      <Section
        bare
        title="Đánh giá phòng: danh sách và phân trang"
        description="Mỗi trang 10 đánh giá, số trang tính từ tổng. Trang quá số trang có nút Về trang đầu. Khi một trang chỉ có đánh giá của chính mình (đã ghim ở trên), trang nói rõ là không có đánh giá nào khác và phân trang vẫn còn. Đổi trang ở đây chạy bằng trạng thái; ở trang tin thật là tham số reviewPage, đổi bằng history.replaceState nên máy chủ không dựng lại trang."
      >
        <Grid>
          <Labeled label="25 đánh giá, 3 trang · bấm số trang hoặc mũi tên">
            <PagedSample kit={ROOM_KIT} reviews={SAMPLE_REVIEWS} />
          </Labeled>
          <Labeled label="21 đánh giá · trang 3 chỉ có đánh giá của mình">
            <PagedSample
              kit={ROOM_KIT}
              reviews={SAMPLE_REVIEWS_ONLY_MINE_LAST}
              initialPage={3}
              pinned
              pinnedReview={SAMPLE_MY_ROOM_REVIEW}
            />
          </Labeled>
          <Labeled label="trang 4 của 3 · trang quá số trang">
            <PagedSample
              kit={ROOM_KIT}
              reviews={SAMPLE_REVIEWS}
              initialPage={4}
            />
          </Labeled>
          <Labeled label="đang tải">
            <ListStateSample kit={ROOM_KIT} loading />
          </Labeled>
          <Labeled label="không tải được · lỗi 500">
            <ListStateSample kit={ROOM_KIT} error={SERVER_ERROR} />
          </Labeled>
          <Labeled label="không tải được · 429 đếm ngược">
            <ListStateSample kit={ROOM_KIT} error={RATE_LIMITED_LONG} />
          </Labeled>
          <Labeled label="chưa có đánh giá nào">
            <ListStateSample kit={ROOM_KIT} empty />
          </Labeled>
        </Grid>
      </Section>
    </>
  );
}
