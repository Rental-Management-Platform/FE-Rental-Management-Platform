// Fake chat data for the `/dev/ui` chat section (spec 0012, AC-24). Typed with the API types, so
// a wrong field fails `npm run typecheck`. No photo path anywhere (`coverImageUrl` is `null`), and
// the clock is fixed, so the labels "Hôm nay" and "Hôm qua" read the same on every day.
import type { ChatMessage, ConversationItem } from "@/lib/api/types";

/** 12:00 on 9 November 2026 in Vietnam. */
export const SAMPLE_NOW = new Date("2026-11-09T05:00:00Z");

const message = (
  seq: number,
  isMine: boolean,
  createdAt: string,
  body: string,
): ChatMessage => ({
  id: `00000000-0000-4000-8000-0000000000${seq}`,
  seq,
  senderId: isMine ? "me" : "other",
  isMine,
  body,
  createdAt,
});

// Starts at `seq` 21, so the list offers "Xem tin cũ hơn". The three days give the two dividers
// "07/11/2026", "Hôm qua" and "Hôm nay". One message has line breaks, one is a single long word,
// and one is HTML-looking text that must come out as plain letters.
export const SAMPLE_MESSAGES: readonly ChatMessage[] = [
  message(
    21,
    false,
    "2026-11-07T08:10:00Z",
    "Chào bạn, phòng này còn trống nhé.",
  ),
  message(
    22,
    true,
    "2026-11-07T08:12:00Z",
    "Dạ cho mình hỏi giá đã gồm điện nước chưa ạ?",
  ),
  message(
    23,
    false,
    "2026-11-08T02:00:00Z",
    "Giá chưa gồm điện nước.\nĐiện 3.500 đ mỗi số, nước 100.000 đ mỗi người.\nWifi 100.000 đ mỗi phòng.",
  ),
  message(
    24,
    true,
    "2026-11-08T16:50:00Z",
    "<script>alert(1)</script> &amp; <b>không in đậm</b>",
  ),
  message(
    25,
    false,
    "2026-11-09T01:30:00Z",
    `Đây là bản đồ đường đi: https://example.com/${"a".repeat(70)}`,
  ),
  message(
    26,
    true,
    "2026-11-09T03:00:00Z",
    "Chiều nay 5 giờ mình qua xem được không ạ?",
  ),
];

const LISTING = {
  id: "10000000-0000-4000-8000-000000000001",
  code: "2m57t2xc",
  slug: "phong-tro-gan-dh-cong-nghiep",
  title: "Phòng trọ gần ĐH Công nghiệp, có gác, giờ giấc tự do",
  price: 3_500_000,
  coverImageUrl: null,
  isPublic: true,
} as const;

export const SAMPLE_LISTING: ConversationItem["listing"] = LISTING;

/** A listing that is no longer public: its cover is always `null` and it has no link. */
export const SAMPLE_HIDDEN_LISTING: ConversationItem["listing"] = {
  ...LISTING,
  id: "10000000-0000-4000-8000-000000000002",
  title: "Căn hộ mini Phan Xích Long, gần khu ăn uống sầm uất",
  price: 6_500_000,
  isPublic: false,
};

const item = (
  id: string,
  over: Partial<ConversationItem> & Pick<ConversationItem, "lastMessage">,
): ConversationItem => ({
  id: `20000000-0000-4000-8000-00000000000${id}`,
  myRole: "tenant",
  listing: SAMPLE_LISTING,
  otherUser: { id: "other", name: "Trần Minh Khoa" },
  lastMessageAt: over.lastMessage.createdAt,
  createdAt: "2026-10-20T03:00:00Z",
  unreadCount: 0,
  ...over,
});

const last = (
  seq: number,
  isMine: boolean,
  createdAt: string,
  body: string,
): ConversationItem["lastMessage"] => ({
  seq,
  senderId: isMine ? "me" : "other",
  isMine,
  body,
  createdAt,
});

// The rows show every kind of time label: today's clock, "Hôm qua", the day and month, and a full
// date for another year. One row is unread (heavier text, a dot), one ends with my own message,
// one has no name for the other person, and one is about a listing that is no longer public.
export const SAMPLE_INBOX: readonly ConversationItem[] = [
  item("1", {
    unreadCount: 2,
    lastMessage: last(
      26,
      false,
      "2026-11-09T04:40:00Z",
      "Dạ được ạ, chiều nay anh ở nhà. Bạn đến địa chỉ trong tin nhé.",
    ),
  }),
  item("2", {
    listing: { ...SAMPLE_LISTING, id: "10000000-0000-4000-8000-000000000003" },
    otherUser: { id: "other2", name: "Nguyễn Hữu Phát" },
    lastMessage: last(
      12,
      true,
      "2026-11-08T07:00:00Z",
      "Cảm ơn anh, mình sẽ cân nhắc rồi báo lại.",
    ),
  }),
  item("3", {
    listing: SAMPLE_HIDDEN_LISTING,
    otherUser: { id: "other3", name: null },
    lastMessage: last(
      2,
      false,
      "2026-11-03T09:00:00Z",
      "Giá chưa gồm điện nước, wifi và rác tính riêng như trong tin đăng bạn nhé.",
    ),
  }),
  item("4", {
    otherUser: { id: "other4", name: "Lê Thị Hồng Nhung" },
    lastMessage: last(
      2,
      false,
      "2025-12-24T09:00:00Z",
      "Phòng còn, có chỗ nấu ăn riêng. Bạn qua xem trực tiếp cho dễ hình dung nhé.",
    ),
  }),
];
