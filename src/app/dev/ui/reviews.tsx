"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LandlordHint } from "@/features/landlord-reviews/components/landlord-hint";
import { classifyLandlordReview } from "@/features/landlord-reviews/review-errors";
import { CountLine } from "@/features/reviews/components/count-line";
import { DeleteReviewDialog } from "@/features/reviews/components/delete-review-dialog";
import {
  MyReviewEditor,
  MyReviewRow,
} from "@/features/reviews/components/my-review-row";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { ReviewList } from "@/features/reviews/components/review-list";
import { ReviewListArea } from "@/features/reviews/components/review-list-area";
import { ReviewsZoneFrame } from "@/features/reviews/components/reviews-zone-frame";
import { WriteBlockSkeleton } from "@/features/reviews/components/reviews-zone-skeleton";
import {
  GuestRowView,
  MineFailure,
} from "@/features/reviews/components/write-block";
import { useReviewForm } from "@/features/reviews/hooks/use-review-form";
import { EMPTY_REVIEW } from "@/features/reviews/schemas/review-schema";
import { createApiError, networkError } from "@/lib/api/errors";
import type { MyReview, PublicReview } from "@/lib/api/types";
import { authHref } from "@/lib/next-path";
import { useCountdown } from "@/lib/use-countdown";
import { useReturnFocus } from "@/lib/use-return-focus";
import {
  pageOf,
  SAMPLE_MY_REVIEW,
  SAMPLE_MY_REVIEW_HIDDEN,
  SAMPLE_PATH,
  SAMPLE_REVIEWS,
  SAMPLE_REVIEWS_ONLY_MINE_LAST,
  SAMPLE_TOO_LONG_COMMENT,
} from "./reviews-sample";
import { Labeled, Section } from "./section";

// Made once, outside the components: a countdown is keyed on the identity of the error object, so
// a new object on every render would start the count again each time.
const RATE_LIMITED = createApiError({
  status: 429,
  code: "RATE_LIMITED",
  message: "Bạn thao tác quá nhanh.",
  retryAfterSeconds: 45,
  retryAfterExact: true,
});
// For a box that is already counting when the page opens: long enough to still be counting
// whenever someone scrolls to it.
const RATE_LIMITED_LONG = createApiError({
  status: 429,
  code: "RATE_LIMITED",
  message: "Bạn thao tác quá nhanh.",
  retryAfterSeconds: 3600,
  retryAfterExact: false,
});
const SERVER_ERROR = createApiError({
  status: 500,
  code: "INTERNAL_ERROR",
  message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
  requestId: "7f3a2c91-4b1e",
});
const ALREADY_EXISTS = createApiError({
  status: 409,
  code: "REVIEW_ALREADY_EXISTS",
  message: "Bạn đã đánh giá chủ trọ này rồi.",
});
const NOT_ELIGIBLE = createApiError({
  status: 403,
  code: "REVIEW_NOT_ELIGIBLE",
  message: "Bạn chỉ đánh giá được chủ trọ đã trả lời tin nhắn của bạn.",
});
const INVALID = createApiError({
  status: 400,
  code: "VALIDATION_FAILED",
  message: "Dữ liệu không hợp lệ.",
  errors: [
    { field: "stars", code: "invalid", message: "Số sao phải từ 1 đến 5." },
    {
      field: "comment",
      code: "invalid",
      message: "Nhận xét có ký tự không được chấp nhận.",
    },
  ],
});
const LANDLORD_GONE = createApiError({
  status: 404,
  code: "LANDLORD_NOT_FOUND",
  message: "Không tìm thấy chủ trọ.",
});

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// A fake send: it waits a moment, says so, and resolves, so the form is not left waiting.
const fakeSend = () =>
  wait(600).then(() => {
    toast("Đã gửi (giả)");
  });

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 md:grid-cols-2">{children}</div>;
}

// The row of the write block, with the line under it the real block draws.
function Block({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 border-b pb-5">{children}</div>;
}

const FIRST_ROWS = SAMPLE_REVIEWS.slice(0, 3);

// One zone as one kind of viewer sees it: the frame, a write block, and a short list.
function RoleSample({ block }: { block: ReactNode }) {
  return (
    <ReviewsZoneFrame
      heading="Đánh giá"
      summary={<CountLine count={SAMPLE_REVIEWS.length} />}
      announcement=""
    >
      {block}
      <ReviewList rows={FIRST_ROWS} busy={false} />
    </ReviewsZoneFrame>
  );
}

// A form for a new review. `seed` is an error the form has just got (it is reported once, a moment
// after mounting, the way a real send reports it), and `rejectWith` is what the send fails with
// when the button is pressed. `stars` and `comment` fill the draft.
function FormSample({
  seed,
  rejectWith,
  stars,
  comment,
}: {
  seed?: unknown;
  rejectWith?: unknown;
  stars?: number;
  comment?: string;
}) {
  const state = useReviewForm(EMPTY_REVIEW, "create", classifyLandlordReview);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      const { form, report } = latest.current;
      if (stars !== undefined) form.setValue("stars", stars);
      if (comment !== undefined) form.setValue("comment", comment);
      if (seed !== undefined) report(seed);
    }, 0);
    return () => clearTimeout(timer);
  }, [seed, stars, comment]);

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <h3 className="text-base">Viết đánh giá của bạn</h3>
      <ReviewForm
        state={state}
        mode="create"
        onSubmit={
          rejectWith === undefined ? fakeSend : () => Promise.reject(rejectWith)
        }
      />
    </div>
  );
}

// The pinned row with its editor and the delete dialog, wired to fake sends.
function PinnedSample({ review }: { review: MyReview }) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const returnFocus = useReturnFocus();

  return (
    <div className="rounded-xl border bg-card p-5">
      {editing ? (
        <MyReviewEditor
          review={review}
          onSave={() =>
            wait(600).then(() => {
              setEditing(false);
              toast("Đã lưu (giả)");
            })
          }
          onCancel={() => setEditing(false)}
          classify={classifyLandlordReview}
        />
      ) : (
        <MyReviewRow
          review={review}
          headingRef={null}
          editRef={null}
          canUpdate
          canDelete
          onEdit={() => setEditing(true)}
          onDelete={() => {
            returnFocus.remember();
            setDeleteOpen(true);
          }}
        />
      )}
      <DeleteReviewDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={deleting}
        failure={null}
        secondsLeft={0}
        classify={classifyLandlordReview}
        onConfirm={() => {
          setDeleting(true);
          void wait(700).then(() => {
            setDeleting(false);
            setDeleteOpen(false);
            toast("Đã xóa (giả)");
          });
        }}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      />
    </div>
  );
}

// The delete dialog, opened from a button, with the failure of the last try already on it.
function DialogSample({ failure }: { failure: unknown }) {
  const [open, setOpen] = useState(false);
  const returnFocus = useReturnFocus();
  // The failure is handed over only while the dialog is open, so its countdown starts when the
  // dialog does, the way a real failure arrives, and not when the page loaded.
  const shown = open ? failure : null;
  const secondsLeft = useCountdown(shown);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => {
          returnFocus.remember();
          setOpen(true);
        }}
      >
        Mở hộp thoại
      </Button>
      <DeleteReviewDialog
        open={open}
        onOpenChange={setOpen}
        isDeleting={false}
        failure={shown}
        secondsLeft={secondsLeft}
        classify={classifyLandlordReview}
        onConfirm={() => toast("Đã bấm Xóa đánh giá (giả)")}
        onCloseAutoFocus={returnFocus.onCloseAutoFocus}
      />
    </>
  );
}

// The list area with its pagination, on a list sliced the way the API slices it. The page is local
// state here and the address in the real zone; everything else is the same code. `pinned` draws
// the viewer's own review above the list, as the real zone does.
function PagedSample({
  reviews,
  initialPage = 1,
  pinned = false,
}: {
  reviews: readonly PublicReview[];
  initialPage?: number;
  pinned?: boolean;
}) {
  const [page, setPage] = useState(initialPage);
  const [announcement, setAnnouncement] = useState("");

  return (
    <ReviewsZoneFrame
      heading="Đánh giá"
      summary={<CountLine count={reviews.length} />}
      announcement={announcement}
    >
      {pinned && (
        <Block>
          <MyReviewRow
            review={SAMPLE_MY_REVIEW}
            headingRef={null}
            editRef={null}
            canUpdate
            canDelete
            onEdit={() => undefined}
            onDelete={() => undefined}
          />
        </Block>
      )}
      <ReviewListArea
        loading={false}
        list={pageOf(reviews, page)}
        error={null}
        busy={false}
        page={page}
        total={reviews.length}
        onPageChange={(to) => {
          setPage(to);
          setAnnouncement(`Trang ${to}`);
        }}
        onRetry={() => undefined}
      />
    </ReviewsZoneFrame>
  );
}

// A zone whose list is in one fixed state: loading, failed, or empty.
function ListStateSample({
  loading = false,
  error = null,
  empty = false,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
}) {
  return (
    <ReviewsZoneFrame heading="Đánh giá" summary={null} announcement="">
      <ReviewListArea
        loading={loading}
        list={
          empty ? { items: [], total: 0, page: 1, pageSize: 10 } : undefined
        }
        error={error}
        busy={false}
        page={1}
        total={null}
        onPageChange={() => undefined}
        onRetry={() => toast("Đã bấm Thử lại")}
      />
    </ReviewsZoneFrame>
  );
}

// The reviews zone of the landlord profile on fake data, with no session and no network (spec 0013,
// AC-21). The pieces are the ones of the real zone, so a change to one shows here. The zone itself
// reads the address, the session and the API, so it is drawn from its parts: the frame, the write
// block in each state, the pinned row, the form, the dialog and the list area.
export function ReviewsSection() {
  return (
    <>
      <Section
        bare
        title="Đánh giá: khu đánh giá theo người xem"
        description="Cùng một khu, năm người xem. Khách thấy một dòng mời đăng nhập. Chủ trọ và admin chỉ đọc, không có khối viết và không gọi API đánh giá của mình. Người tìm trọ chưa đủ điều kiện thấy lời gợi ý, và khối viết có khung chờ cùng hai kiểu lỗi đọc. Danh sách công khai luôn hiện bên dưới."
      >
        <Grid>
          <Labeled label="khách · dòng mời đăng nhập, quay lại đúng trang">
            <RoleSample
              block={
                <GuestRowView
                  href={authHref("/login", SAMPLE_PATH)}
                  label="Đăng nhập để đánh giá chủ trọ"
                />
              }
            />
          </Labeled>
          <Labeled label="chủ trọ hoặc admin · không có khối viết">
            <RoleSample block={null} />
          </Labeled>
          <Labeled label="người tìm trọ chưa đủ điều kiện · lời gợi ý">
            <RoleSample
              block={
                <Block>
                  <LandlordHint />
                </Block>
              }
            />
          </Labeled>
          <Labeled label="người tìm trọ · đang kiểm tra trạng thái">
            <RoleSample block={<WriteBlockSkeleton />} />
          </Labeled>
          <Labeled label="không tải được trạng thái · lỗi 500">
            <RoleSample
              block={
                <MineFailure error={SERVER_ERROR} onRetry={() => undefined} />
              }
            />
          </Labeled>
          <Labeled label="không tải được trạng thái · 429 đếm ngược">
            <RoleSample
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
        title="Đánh giá: biểu mẫu viết đánh giá"
        description="Các ô sao là một nhóm radio: Tab vào nhóm một lần, phím mũi tên đổi số sao. Bản nháp luôn còn nguyên sau mọi lỗi. Ba ô đầu cần bấm: bấm Đăng đánh giá khi chưa chọn sao để thấy lời nhắc, bấm ở ô có sẵn dữ liệu để thấy lỗi 400 nằm dưới từng ô, và bấm ở ô cuối để gửi giả thành công. Các ô còn lại đã có lỗi ngay từ đầu."
      >
        <Grid>
          <Labeled label="trống · chưa chọn sao, bấm Đăng đánh giá">
            <FormSample />
          </Labeled>
          <Labeled label="lỗi 400 về từng ô · bấm Đăng đánh giá">
            <FormSample
              stars={4}
              comment="Nhận xét có sẵn"
              rejectWith={INVALID}
            />
          </Labeled>
          <Labeled label="gửi giả thành công · bấm Đăng đánh giá">
            <FormSample
              stars={4}
              comment="Phòng sạch, chủ trọ dễ nói chuyện."
            />
          </Labeled>
          <Labeled label="nhận xét quá 1000 ký tự · nút tắt, số đếm đỏ">
            <FormSample stars={3} comment={SAMPLE_TOO_LONG_COMMENT} />
          </Labeled>
          <Labeled label="409 đã đánh giá rồi (REVIEW_ALREADY_EXISTS)">
            <FormSample
              stars={5}
              comment="Chủ trọ rất nhiệt tình."
              seed={ALREADY_EXISTS}
            />
          </Labeled>
          <Labeled label="403 chưa đủ điều kiện (REVIEW_NOT_ELIGIBLE)">
            <FormSample stars={5} seed={NOT_ELIGIBLE} />
          </Labeled>
          <Labeled label="429 đếm ngược · nút tắt cho tới khi hết">
            <FormSample stars={4} seed={RATE_LIMITED_LONG} />
          </Labeled>
          <Labeled label="lỗi 500 · có mã hỗ trợ">
            <FormSample
              stars={2}
              comment="Bản nháp còn nguyên."
              seed={SERVER_ERROR}
            />
          </Labeled>
          <Labeled label="lỗi mạng · nút dùng lại được, không tự gửi lại">
            <FormSample stars={4} seed={networkError()} />
          </Labeled>
          <Labeled label="chủ trọ không còn (LANDLORD_NOT_FOUND)">
            <FormSample stars={4} seed={LANDLORD_GONE} />
          </Labeled>
        </Grid>
      </Section>

      <Section
        bare
        title="Đánh giá: đánh giá của bạn, sửa và xóa"
        description="Thẻ ghim là nơi duy nhất có Sửa và Xóa. Bấm Sửa để mở biểu mẫu sửa (Hủy bỏ bản nháp), bấm Xóa để mở hộp thoại: nút Giữ lại nhận focus đầu tiên và bấm ra ngoài không đóng. Khi quản trị viên đã ẩn đánh giá, thẻ nói rõ bằng chữ, hiện lý do và chỉ còn nút Xóa."
      >
        <Grid>
          <Labeled label="đánh giá đang hiện · Sửa và Xóa">
            <PinnedSample review={SAMPLE_MY_REVIEW} />
          </Labeled>
          <Labeled label="bị quản trị viên ẩn · chỉ còn Xóa, có lý do">
            <PinnedSample review={SAMPLE_MY_REVIEW_HIDDEN} />
          </Labeled>
        </Grid>
        <div className="flex flex-wrap gap-6">
          <Labeled label="hộp thoại xóa · bình thường">
            <DialogSample failure={null} />
          </Labeled>
          <Labeled label="hộp thoại xóa · 429 đếm ngược">
            <DialogSample failure={RATE_LIMITED} />
          </Labeled>
          <Labeled label="hộp thoại xóa · lỗi mạng">
            <DialogSample failure={networkError()} />
          </Labeled>
        </div>
      </Section>

      <Section
        bare
        title="Đánh giá: danh sách và phân trang"
        description="Mỗi trang 10 đánh giá, số trang tính từ tổng. Trang quá số trang có nút Về trang đầu. Khi một trang chỉ có đánh giá của chính mình (đã ghim ở trên), trang nói rõ là không có đánh giá nào khác và phân trang vẫn còn. Đổi trang ở đây chạy bằng trạng thái; ở trang thật là tham số reviewPage."
      >
        <Grid>
          <Labeled label="25 đánh giá, 3 trang · bấm số trang hoặc mũi tên">
            <PagedSample reviews={SAMPLE_REVIEWS} />
          </Labeled>
          <Labeled label="21 đánh giá · trang 3 chỉ có đánh giá của mình">
            <PagedSample
              reviews={SAMPLE_REVIEWS_ONLY_MINE_LAST}
              initialPage={3}
              pinned
            />
          </Labeled>
          <Labeled label="trang 4 của 3 · trang quá số trang">
            <PagedSample reviews={SAMPLE_REVIEWS} initialPage={4} />
          </Labeled>
          <Labeled label="đang tải">
            <ListStateSample loading />
          </Labeled>
          <Labeled label="không tải được · lỗi 500">
            <ListStateSample error={SERVER_ERROR} />
          </Labeled>
          <Labeled label="không tải được · 429 đếm ngược">
            <ListStateSample error={RATE_LIMITED_LONG} />
          </Labeled>
          <Labeled label="chưa có đánh giá nào">
            <ListStateSample empty />
          </Labeled>
        </Grid>
      </Section>
    </>
  );
}
