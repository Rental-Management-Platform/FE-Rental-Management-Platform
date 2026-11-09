"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ChatIndicatorView } from "@/features/chat/components/chat-indicator";
import { Composer } from "@/features/chat/components/composer";
import { ConversationListingCard } from "@/features/chat/components/conversation-listing-card";
import { FirstMessageDialogView } from "@/features/chat/components/first-message-dialog";
import {
  InboxEmpty,
  InboxList,
  InboxSkeleton,
} from "@/features/chat/components/inbox-screen";
import { MessageList } from "@/features/chat/components/message-list";
import { useComposer } from "@/features/chat/hooks/use-composer";
import type { OlderMessages } from "@/features/chat/hooks/use-older-messages";
import { createApiError, networkError } from "@/lib/api/errors";
import {
  SAMPLE_HIDDEN_LISTING,
  SAMPLE_INBOX,
  SAMPLE_LISTING,
  SAMPLE_MESSAGES,
  SAMPLE_NOW,
} from "./chat-sample";
import { Labeled, Section } from "./section";

const OTHER_NAME = "Trần Minh Khoa";
const noop = () => undefined;

const IDLE: OlderMessages = {
  isPending: false,
  isError: false,
  quiet: false,
  load: () => toast("Đã bấm Xem tin cũ hơn"),
};
const LOADING: OlderMessages = { ...IDLE, isPending: true };
const FAILED: OlderMessages = { ...IDLE, isError: true };

// Made once, outside the components: a countdown is keyed on the identity of the error object, so
// a new object on every render would start the count again each time.
const PEER_UNAVAILABLE = createApiError({
  status: 409,
  code: "CHAT_PEER_UNAVAILABLE",
  message: "Người kia hiện không nhận được tin nhắn.",
});
const RATE_LIMITED = createApiError({
  status: 429,
  code: "RATE_LIMITED",
  message: "Bạn thao tác quá nhanh.",
  retryAfterSeconds: 45,
  retryAfterExact: true,
});
// For the message box that is already counting when the page opens: long enough that it is still
// counting whenever someone scrolls to it. The dialog uses the short one, which starts when its
// "Gửi" is pressed.
const RATE_LIMITED_LONG = createApiError({
  status: 429,
  code: "RATE_LIMITED",
  message: "Bạn thao tác quá nhanh.",
  retryAfterSeconds: 600,
  retryAfterExact: true,
});
const LISTING_GONE = createApiError({
  status: 404,
  code: "LISTING_NOT_FOUND",
  message: "Không tìm thấy tin.",
});

// A fake send: it waits a moment, says so, and resolves, so the message box clears its draft.
const fakeSend = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 600)).then(() => {
    toast("Đã gửi (giả)");
  });

// The list in a column of a fixed height, as the conversation page gives it.
function ListSample({
  older = IDLE,
  unseen = 0,
  height = "h-80",
}: {
  older?: OlderMessages;
  unseen?: number;
  height?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className={`flex ${height} flex-col rounded-xl border bg-card`}>
      <MessageList
        messages={SAMPLE_MESSAGES}
        otherName={OTHER_NAME}
        now={SAMPLE_NOW}
        older={older}
        scrollRef={scrollRef}
        onScroll={noop}
        unseen={unseen}
        scrollToBottom={() => toast("Đã bấm Tin mới")}
      />
    </div>
  );
}

// One whole conversation: the card of the listing, the list and the message box.
function ConversationSample() {
  const composer = useComposer("send");
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-xl border bg-card">
      <ConversationListingCard
        listing={SAMPLE_LISTING}
        otherName={OTHER_NAME}
      />
      <Separator />
      <MessageList
        messages={SAMPLE_MESSAGES}
        otherName={OTHER_NAME}
        now={SAMPLE_NOW}
        older={IDLE}
        scrollRef={scrollRef}
        onScroll={noop}
        unseen={3}
        scrollToBottom={() => toast("Đã bấm Tin mới")}
      />
      <Separator />
      <div className="p-3">
        <Composer
          composer={composer}
          onSend={fakeSend}
          placeholder="Nhập tin nhắn"
        />
      </div>
    </div>
  );
}

// A message box that has just failed in one way, with a draft in it. The failure is reported once,
// a moment after mounting, the way a real send reports it.
function FailedComposer({ error }: { error: unknown }) {
  const composer = useComposer("send");
  const latest = useRef(composer);
  useEffect(() => {
    latest.current = composer;
  });
  useEffect(() => {
    const timer = setTimeout(() => {
      latest.current.form.setValue(
        "body",
        "Mình muốn xem phòng vào cuối tuần ạ",
      );
      latest.current.report(error);
    }, 0);
    return () => clearTimeout(timer);
  }, [error]);
  return (
    <div className="rounded-xl border bg-card p-3">
      <Composer
        composer={composer}
        onSend={() => Promise.reject(error)}
        placeholder="Nhập tin nhắn"
      />
    </div>
  );
}

// The first message dialog with a send that fails in the way given. The draft is filled on open.
function DialogSample({ fail }: { fail: () => Promise<never> }) {
  const composer = useComposer("open");
  const [open, setOpen] = useState(false);
  const { form } = composer;
  return (
    <FirstMessageDialogView
      open={open}
      onOpenChange={(next) => {
        if (next && form.getValues("body") === "") {
          form.setValue("body", "Phòng còn trống không ạ?");
        }
        setOpen(next);
      }}
      composer={composer}
      onSend={fail}
      listingTitle={SAMPLE_LISTING.title}
      landlordName={OTHER_NAME}
    />
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 md:grid-cols-2">{children}</div>;
}

// The chat on fake data, with no session and no network (spec 0012, AC-24): the conversation in
// every state of its list, the inbox, the first message dialog with each way its send can fail, the
// message box locked and waiting, and the indicator.
export function ChatSection() {
  return (
    <>
      <Section
        title="Tin nhắn: cuộc trò chuyện"
        description="Tin hai phía, vạch ngày cắt theo giờ Việt Nam, giờ dưới mỗi tin, tin nhiều dòng, một chữ rất dài, và chữ trông như mã HTML hiện nguyên văn. Nút “Tin mới” nằm ngoài vùng log. Đầu danh sách có “Xem tin cũ hơn” vì tin đầu có số thứ tự lớn hơn 1."
      >
        <ConversationSample />
        <Grid>
          <Labeled label="xem tin cũ hơn · đang tải">
            <ListSample older={LOADING} height="h-56" />
          </Labeled>
          <Labeled label="xem tin cũ hơn · lỗi">
            <ListSample older={FAILED} height="h-56" />
          </Labeled>
        </Grid>
      </Section>

      <Section
        title="Tin nhắn: thẻ tin ở đầu trang"
        description="Tin còn hiển thị là một liên kết tới trang tin. Tin không còn hiển thị không có liên kết và có nhãn, nhưng vẫn nhắn được."
      >
        <Grid>
          <Labeled label="isPublic · true">
            <div className="rounded-xl border bg-card">
              <ConversationListingCard
                listing={SAMPLE_LISTING}
                otherName={OTHER_NAME}
              />
            </div>
          </Labeled>
          <Labeled label="isPublic · false">
            <div className="rounded-xl border bg-card">
              <ConversationListingCard
                listing={SAMPLE_HIDDEN_LISTING}
                otherName={OTHER_NAME}
              />
            </div>
          </Labeled>
        </Grid>
      </Section>

      <Section
        title="Tin nhắn: hộp thư"
        bare
        description="Hàng chưa đọc in đậm, có chấm và có chữ “chưa đọc” cho trình đọc màn hình. Nhãn giờ: giờ trong ngày, “Hôm qua”, ngày và tháng, rồi đủ ngày khi khác năm. Hàng thứ hai kết thúc bằng tin của mình nên có “Bạn:”. Hàng thứ ba không có tên người kia."
      >
        <div className="flex flex-col gap-6">
          <InboxList
            items={SAMPLE_INBOX}
            basePath="/tin-nhan"
            now={SAMPLE_NOW}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <Labeled label="trống · người tìm trọ">
              <InboxEmpty side="tenant" />
            </Labeled>
            <Labeled label="trống · chủ trọ">
              <InboxEmpty side="landlord" />
            </Labeled>
          </div>
          <Labeled label="đang tải">
            <InboxSkeleton />
          </Labeled>
        </div>
      </Section>

      <Section
        title="Tin nhắn: hộp thoại tin đầu và ô soạn"
        description="Mở từng hộp thoại và bấm Gửi để thấy lỗi. Bản nháp luôn còn nguyên. Ô soạn bên dưới đã bị khóa hoặc đang đếm ngược ngay từ đầu."
      >
        <div className="flex flex-wrap gap-6">
          <Labeled label="hộp thoại · lỗi mạng">
            <DialogSample fail={() => Promise.reject(networkError())} />
          </Labeled>
          <Labeled label="hộp thoại · tin vừa bị ẩn">
            <DialogSample fail={() => Promise.reject(LISTING_GONE)} />
          </Labeled>
          <Labeled label="hộp thoại · 429 đếm ngược">
            <DialogSample fail={() => Promise.reject(RATE_LIMITED)} />
          </Labeled>
        </div>
        <Grid>
          <Labeled label="ô soạn · người kia bị khóa (CHAT_PEER_UNAVAILABLE)">
            <FailedComposer error={PEER_UNAVAILABLE} />
          </Labeled>
          <Labeled label="ô soạn · 429 đếm ngược">
            <FailedComposer error={RATE_LIMITED_LONG} />
          </Labeled>
        </Grid>
      </Section>

      <Section
        title="Tin nhắn: chỉ báo chưa đọc"
        description="Một bong bóng tin nhắn với số cuộc trò chuyện chưa đọc. Ẩn số khi là 0, tối đa “99+”. Số không nằm trong vùng đọc tự động."
      >
        <div className="flex flex-wrap items-end gap-8">
          {[0, 7, 120].map((unread) => (
            <Labeled key={unread} label={`${unread} · cỡ lg`}>
              <ChatIndicatorView size="lg" href="/tin-nhan" unread={unread} />
            </Labeled>
          ))}
          <Labeled label="7 · cỡ default">
            <ChatIndicatorView size="default" href="/tin-nhan" unread={7} />
          </Labeled>
        </div>
      </Section>
    </>
  );
}
