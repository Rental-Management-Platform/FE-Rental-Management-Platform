import {
  BadgeDollarSignIcon,
  FilePlusIcon,
  FileTextIcon,
  LayoutGridIcon,
  ListChecksIcon,
  LogInIcon,
  SearchIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import type { NavItem } from "@/components/shells/nav-config";

export type ScreenGroup = "public" | "auth" | "landlord" | "admin";

export interface ScreenInfo {
  href: string;
  title: string;
  description: string;
  group: ScreenGroup;
  icon: LucideIcon;
  /** The short label in the sample menus. */
  navLabel: string;
}

export const SCREENS_HOME = "/dev/ui/screens";

// The seven sample screens of spec 0003 (AC-14), in the order the index shows them.
export const SCREENS: readonly ScreenInfo[] = [
  {
    href: `${SCREENS_HOME}/listings`,
    title: "Danh sách tin",
    description:
      "Tìm kiếm, lọc theo phường và giá, thẻ tin và phân trang. Xem được cả trạng thái trống, đang tải, lỗi và bị giới hạn tần suất.",
    group: "public",
    icon: SearchIcon,
    navLabel: "Tìm trọ",
  },
  {
    href: `${SCREENS_HOME}/listing-detail`,
    title: "Chi tiết tin",
    description:
      "Thông tin phòng, nhà trọ, các khoản phí và chủ trọ. Khách phải đăng nhập mới thấy số điện thoại.",
    group: "public",
    icon: FileTextIcon,
    navLabel: "Chi tiết tin",
  },
  {
    href: `${SCREENS_HOME}/pricing`,
    title: "Bảng giá gói",
    description:
      "Mỗi gói một thẻ. Nút mua chỉ hiện cho chủ trọ đã đăng nhập, đổi người xem để thử.",
    group: "public",
    icon: BadgeDollarSignIcon,
    navLabel: "Bảng giá",
  },
  {
    href: `${SCREENS_HOME}/sign-in`,
    title: "Đăng nhập",
    description:
      "Biểu mẫu trong khung đăng nhập. Giả lập lỗi từng ô, tài khoản bị khóa và giới hạn tần suất.",
    group: "auth",
    icon: LogInIcon,
    navLabel: "Đăng nhập",
  },
  {
    href: `${SCREENS_HOME}/my-listings`,
    title: "Tin của tôi",
    description:
      "Bảng tin của chủ trọ với nhãn trạng thái, ẩn, hiện và xác nhận xóa.",
    group: "landlord",
    icon: ListChecksIcon,
    navLabel: "Tin của tôi",
  },
  {
    href: `${SCREENS_HOME}/post-listing`,
    title: "Đăng tin",
    description:
      "Biểu mẫu đăng tin có kiểm tra nhẹ ở trình duyệt và lỗi từng ô từ máy chủ.",
    group: "landlord",
    icon: FilePlusIcon,
    navLabel: "Đăng tin",
  },
  {
    href: `${SCREENS_HOME}/admin-users`,
    title: "Người dùng",
    description:
      "Bảng người dùng cho admin: tìm kiếm, lọc, khóa và mở khóa với lý do bắt buộc. Có đủ bốn trạng thái.",
    group: "admin",
    icon: UsersIcon,
    navLabel: "Người dùng",
  },
];

export const GROUP_LABEL: Record<ScreenGroup, string> = {
  public: "Trang công khai, điện thoại trước",
  auth: "Khung đăng nhập",
  landlord: "Khu chủ trọ, máy tính trước",
  admin: "Khu admin, máy tính trước",
};

const HOME_ITEM: NavItem = {
  label: "Màn hình mẫu",
  href: SCREENS_HOME,
  icon: LayoutGridIcon,
};

const navFor = (hrefs: readonly string[]): readonly NavItem[] => [
  ...SCREENS.filter((screen) => hrefs.includes(screen.href)).map(
    ({ navLabel, href, icon }) => ({ label: navLabel, href, icon }),
  ),
  HOME_ITEM,
];

// The real nav arrays are nearly empty until the features that own the pages ship, so each
// sample screen passes its own. Every link points at a page that exists. Within one list the
// longest matching address is the current page, so the home item is current only on the index.
export const PUBLIC_SCREENS_NAV = navFor([
  `${SCREENS_HOME}/listings`,
  `${SCREENS_HOME}/pricing`,
]);
export const LANDLORD_SCREENS_NAV = navFor([
  `${SCREENS_HOME}/my-listings`,
  `${SCREENS_HOME}/post-listing`,
]);
export const ADMIN_SCREENS_NAV = navFor([`${SCREENS_HOME}/admin-users`]);
