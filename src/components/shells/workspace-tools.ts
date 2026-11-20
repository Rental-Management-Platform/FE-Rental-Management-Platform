import {
  Banknote,
  FilePlusCorner,
  House,
  HousePlus,
  KeyRound,
  ListChecks,
  MapPinned,
  MessageSquareWarning,
  MessagesSquare,
  ReceiptText,
  ShieldAlert,
  Tags,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ACCOUNT_PATH } from "@/features/account/access";
import { ADMIN_CATALOG_PATH } from "@/features/admin-catalog/admin-catalog-path";
import { ADMIN_LISTINGS_PATH } from "@/features/admin-listings/admin-listings-path";
import { ADMIN_ORDERS_PATH } from "@/features/admin-orders/admin-orders-path";
import { ADMIN_PERMISSIONS_PATH } from "@/features/admin-permissions/admin-permissions-path";
import { ADMIN_PLANS_PATH } from "@/features/admin-plans/admin-plans-path";
import { ADMIN_REVENUE_PATH } from "@/features/admin-revenue/admin-revenue-path";
import { ADMIN_REVIEWS_PATH } from "@/features/admin-reviews/admin-reviews-path";
import { ADMIN_USERS_PATH } from "@/features/admin-users/admin-users-path";
import { LANDLORD_CHAT_BASE } from "@/features/chat/access";
import { MY_LISTINGS_PATH } from "@/features/listing/listing-filter";
import { ORDERS_PATH } from "@/features/order/order-paths";
import { MY_PROPERTIES_PATH } from "@/features/property/property-list";
import type { PermissionKey } from "@/lib/api/types";
import type { NavItem } from "./nav-config";

// One tool of a work area. A `ready` tool is a side menu item, and the menu is the only way into
// the tools: the overview pages of both areas are statistics screens and draw no tool cards (spec
// 0024 and 0025). A `ready` tool always has an address and a `soon` tool never has one: a mix does
// not compile.
export type Tool = {
  /** Stable name, such as "property.create". */
  id: string;
  label: string;
  icon: LucideIcon;
  /** The menu item is hidden when the person lacks it. */
  permission?: PermissionKey;
} & ({ status: "soon"; href?: never } | { status: "ready"; href: string });

// To turn a tool on, the feature that ships its page changes its entry from `soon` to `ready`
// with the address, in the same change as the page. The menu gains the item at the same place.
// The owning feature may also reword the label, which is a draft for the tools that do not exist
// yet (spec 0008).
//
// Scope items #10 and #17 have no entry: neither has a page of its own. Photos live on the edit
// listing page, reached through "Tin của tôi", and the quota strip sits at the top of that page.
export const LANDLORD_TOOLS: readonly Tool[] = [
  {
    id: "property.create",
    label: "Thêm nhà trọ",
    icon: HousePlus,
    permission: "property:create",
    status: "ready",
    href: "/landlord/properties/new",
  },
  {
    id: "property.mine",
    label: "Nhà trọ của tôi",
    icon: House,
    permission: "property:read",
    status: "ready",
    href: MY_PROPERTIES_PATH,
  },
  {
    id: "listing.create",
    label: "Đăng tin",
    icon: FilePlusCorner,
    permission: "listing:create",
    status: "ready",
    href: "/landlord/listings/new",
  },
  {
    id: "listing.mine",
    label: "Tin của tôi",
    icon: ListChecks,
    permission: "listing:read",
    status: "ready",
    href: MY_LISTINGS_PATH,
  },
  {
    id: "chat.inbox",
    label: "Tin nhắn",
    icon: MessagesSquare,
    permission: "conversation:read",
    status: "ready",
    href: LANDLORD_CHAT_BASE,
  },
  {
    id: "billing.mine",
    label: "Gói và đơn của tôi",
    icon: ReceiptText,
    permission: "order:read",
    status: "ready",
    href: ORDERS_PATH,
  },
  {
    id: "profile",
    label: "Hồ sơ và mật khẩu",
    icon: UserRound,
    permission: "profile:read",
    status: "ready",
    href: ACCOUNT_PATH,
  },
];

// An admin tool is `soon` until the feature that ships its page turns it on: only the profile (#28),
// the users (#20), the listing moderation (#21), the review moderation (#36), the orders of every
// landlord (#25), the revenue (#26), the plans and trial settings (#22), the catalog (#23) and the
// permissions (#24) are ready today (the rule is in spec 0008). An admin holds every permission, so no menu item
// hides today: the field keeps the rule the same for both areas and survives a change in the
// contract. The strip "Cần xử lý" of the admin overview reads the permission of `moderation` and
// `reviews` from here (spec 0025, AC-5). Every money figure here is a test payment.
export const ADMIN_TOOLS: readonly Tool[] = [
  {
    id: "moderation",
    label: "Kiểm duyệt tin",
    icon: ShieldAlert,
    permission: "listing:moderate",
    status: "ready",
    href: ADMIN_LISTINGS_PATH,
  },
  {
    id: "reviews",
    label: "Kiểm duyệt đánh giá",
    icon: MessageSquareWarning,
    permission: "review:moderate",
    status: "ready",
    href: ADMIN_REVIEWS_PATH,
  },
  {
    id: "users",
    label: "Người dùng",
    icon: Users,
    permission: "user:read",
    status: "ready",
    href: ADMIN_USERS_PATH,
  },
  {
    id: "orders.all",
    label: "Đơn của mọi chủ trọ",
    icon: ReceiptText,
    permission: "order:report",
    status: "ready",
    href: ADMIN_ORDERS_PATH,
  },
  {
    id: "revenue",
    label: "Doanh thu",
    icon: Banknote,
    permission: "order:report",
    status: "ready",
    href: ADMIN_REVENUE_PATH,
  },
  {
    id: "plans",
    label: "Gói và dùng thử",
    icon: Tags,
    permission: "plan:read",
    status: "ready",
    href: ADMIN_PLANS_PATH,
  },
  {
    id: "catalog",
    label: "Danh mục",
    icon: MapPinned,
    permission: "catalog:read",
    status: "ready",
    href: ADMIN_CATALOG_PATH,
  },
  {
    id: "permissions",
    label: "Phân quyền",
    icon: KeyRound,
    permission: "account_type:read",
    status: "ready",
    href: ADMIN_PERMISSIONS_PATH,
  },
  {
    id: "profile",
    label: "Hồ sơ",
    icon: UserRound,
    permission: "profile:read",
    status: "ready",
    href: ACCOUNT_PATH,
  },
];

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
