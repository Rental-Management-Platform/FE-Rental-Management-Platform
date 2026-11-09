import {
  Banknote,
  FilePlusCorner,
  House,
  HousePlus,
  KeyRound,
  ListChecks,
  MapPinned,
  MessagesSquare,
  ReceiptText,
  ShieldAlert,
  Tags,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { LANDLORD_CHAT_BASE } from "@/features/chat/access";
import type { PermissionKey } from "@/lib/api/types";
import type { SessionState } from "@/lib/session/create-session";
import type { NavItem } from "./nav-config";
import { visibleNavItems } from "./visible-nav-items";

// The number a card may show under its description. It is only a name here: the dashboard
// feature reads and words the number (spec 0008, "Value sourcing").
export type StatKey =
  // landlord
  | "propertyCount"
  | "quota"
  | "myListings"
  | "plan"
  | "unreadChat"
  // admin
  | "hiddenListings"
  | "users"
  | "paidOrders"
  | "revenue";

// One tool of a work area. The same entry draws a dashboard card and, once it is ready, a side
// menu item, so the two cannot disagree (spec 0008, AC-5). A `ready` tool always has an address
// and a `soon` tool never has one: a mix does not compile.
export type Tool = {
  /** Stable name, such as "property.create". */
  id: string;
  /** The heading of the group the card sits in. Groups follow the order of first appearance. */
  group: string;
  label: string;
  /** One line. */
  description: string;
  icon: LucideIcon;
  /** The card is hidden, and the menu item too, when the person lacks it. */
  permission?: PermissionKey;
  /** One number slot on the card. */
  stat?: StatKey;
} & ({ status: "soon"; href?: never } | { status: "ready"; href: string });

export interface ToolGroup {
  name: string;
  tools: Tool[];
}

// To turn a tool on, the feature that ships its page changes its entry from `soon` to `ready`
// with the address, in the same change as the page. The card links and the menu gains the item
// at the same place. The owning feature may also reword the label and the description, which
// are drafts for the tools that do not exist yet (spec 0008).
//
// Scope items #10 and #17 have no card: neither has a page of its own. Photos live on the edit
// listing page, reached through "Tin của tôi", and the quota strip sits at the top of that page.
export const LANDLORD_TOOLS: readonly Tool[] = [
  {
    id: "property.create",
    group: "Nhà trọ",
    label: "Thêm nhà trọ",
    description: "Nhập tên, địa chỉ và phường hoặc xã của nhà trọ.",
    icon: HousePlus,
    permission: "property:create",
    stat: "propertyCount",
    status: "ready",
    href: "/landlord/properties/new",
  },
  {
    id: "property.mine",
    group: "Nhà trọ",
    label: "Nhà trọ của tôi",
    description: "Xem, sửa và xóa các nhà trọ bạn đã tạo.",
    icon: House,
    permission: "property:read",
    stat: "propertyCount",
    status: "soon",
  },
  {
    id: "listing.create",
    group: "Tin đăng",
    label: "Đăng tin",
    description: "Đăng tin kèm 1 đến 5 ảnh. Tin hiện ngay, không cần duyệt.",
    icon: FilePlusCorner,
    permission: "listing:create",
    stat: "quota",
    status: "ready",
    href: "/landlord/listings/new",
  },
  {
    id: "listing.mine",
    group: "Tin đăng",
    label: "Tin của tôi",
    description: "Ẩn, hiện, sửa tin và quản lý ảnh của từng tin.",
    icon: ListChecks,
    permission: "listing:read",
    stat: "myListings",
    status: "soon",
  },
  {
    // Spec 0012, AC-19. The number on the card is the unread count the page header indicator
    // already reads, through the same cache entry.
    id: "chat.inbox",
    group: "Tin nhắn",
    label: "Tin nhắn",
    description: "Trả lời những người tìm trọ đã nhắn cho bạn.",
    icon: MessagesSquare,
    permission: "conversation:read",
    stat: "unreadChat",
    status: "ready",
    href: LANDLORD_CHAT_BASE,
  },
  {
    id: "billing.mine",
    group: "Gói và đơn",
    label: "Gói và đơn của tôi",
    description:
      "Xem gói đang dùng, mua gói và xem lịch sử đơn. Thanh toán là thanh toán thử.",
    icon: ReceiptText,
    permission: "order:read",
    stat: "plan",
    status: "soon",
  },
  {
    id: "profile",
    group: "Tài khoản",
    label: "Hồ sơ và mật khẩu",
    description: "Sửa tên, số điện thoại và đổi mật khẩu.",
    icon: UserRound,
    permission: "profile:read",
    status: "soon",
  },
];

// Every admin tool is soon today, because #20 to #26 and #28 are planned. An admin holds every
// permission, so no card hides today: the field keeps the rule the same for both areas and
// survives a change in the contract. Every money figure here is a test payment.
export const ADMIN_TOOLS: readonly Tool[] = [
  {
    id: "moderation",
    group: "Cần xem thường xuyên",
    label: "Kiểm duyệt tin",
    description: "Tìm tin của mọi chủ trọ, ẩn hoặc gỡ ẩn kèm lý do.",
    icon: ShieldAlert,
    permission: "listing:moderate",
    stat: "hiddenListings",
    status: "soon",
  },
  {
    id: "users",
    group: "Cần xem thường xuyên",
    label: "Người dùng",
    description: "Tìm tài khoản, khóa, mở khóa và thu hồi phiên đăng nhập.",
    icon: Users,
    permission: "user:read",
    stat: "users",
    status: "soon",
  },
  {
    id: "orders.all",
    group: "Tiền (thanh toán thử)",
    label: "Đơn của mọi chủ trọ",
    description: "Xem đơn mua gói, lọc theo trạng thái, chủ trọ, gói và ngày.",
    icon: ReceiptText,
    permission: "order:report",
    stat: "paidOrders",
    status: "soon",
  },
  {
    id: "revenue",
    group: "Tiền (thanh toán thử)",
    label: "Doanh thu",
    description: "Doanh thu theo gói và theo thời gian.",
    icon: Banknote,
    permission: "order:report",
    stat: "revenue",
    status: "soon",
  },
  {
    id: "plans",
    group: "Cài đặt hệ thống",
    label: "Gói và dùng thử",
    description: "Tạo, sửa, tắt gói và đổi số ngày, số tin dùng thử.",
    icon: Tags,
    permission: "plan:read",
    status: "soon",
  },
  {
    id: "catalog",
    group: "Cài đặt hệ thống",
    label: "Danh mục",
    description: "Quản lý phường, xã, đặc khu và tiện ích.",
    icon: MapPinned,
    permission: "catalog:read",
    status: "soon",
  },
  {
    id: "permissions",
    group: "Cài đặt hệ thống",
    label: "Phân quyền",
    description: "Chọn hành động mỗi loại tài khoản được làm.",
    icon: KeyRound,
    permission: "account_type:read",
    status: "soon",
  },
  {
    id: "profile",
    group: "Tài khoản của tôi",
    label: "Hồ sơ",
    description: "Sửa tên, số điện thoại và đổi mật khẩu.",
    icon: UserRound,
    permission: "profile:read",
    status: "soon",
  },
];

// Hiding a tool is a convenience: the backend still decides what a person may do. A tool hidden
// by permission is never drawn as dimmed (spec 0008, AC-6).
export const visibleTools = (
  tools: readonly Tool[],
  state: SessionState,
): Tool[] => visibleNavItems(tools, state);

// Groups in the order of their first tool, each with its tools in list order.
export const groupTools = (tools: readonly Tool[]): ToolGroup[] =>
  tools.reduce<ToolGroup[]>((groups, tool) => {
    const at = groups.findIndex((group) => group.name === tool.group);
    return at === -1
      ? [...groups, { name: tool.group, tools: [tool] }]
      : groups.map((group, index) =>
          index === at ? { ...group, tools: [...group.tools, tool] } : group,
        );
  }, []);

// The side menu items of a list: the ready tools, in list order.
export const navItemsOf = (tools: readonly Tool[]): NavItem[] =>
  tools.flatMap((tool) =>
    tool.status === "ready"
      ? [
          {
            label: tool.label,
            href: tool.href,
            icon: tool.icon,
            permission: tool.permission,
          },
        ]
      : [],
  );
