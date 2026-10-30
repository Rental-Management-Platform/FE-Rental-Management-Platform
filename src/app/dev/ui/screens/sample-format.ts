// Text helpers that only the sample screens use. Money, area and dates moved to
// `src/lib/format.ts` with the first feature that shows a price (spec 0006, AC-13).
import type {
  AccountType,
  FeeKind,
  FeeUnit,
  ListingStatus,
  PropertyFee,
} from "@/lib/api/types";
import { formatMoney } from "@/lib/format";

const COUNT = new Intl.NumberFormat("vi-VN");

/** 1248 becomes "1.248". */
export const formatCount = (n: number) => COUNT.format(n);

/** "0901234567" becomes "0901 234 567". Any other shape is shown as it came. */
export const formatPhone = (phone: string) =>
  phone.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");

const FEE_KIND_LABEL: Record<FeeKind, string> = {
  electricity: "Điện",
  water: "Nước",
  internet: "Internet",
  parking: "Giữ xe",
  service: "Dịch vụ",
  other: "Khác",
};

const FEE_UNIT_LABEL: Record<FeeUnit, string> = {
  per_kwh: "kWh",
  per_m3: "m³",
  per_month: "tháng",
  per_person_month: "người mỗi tháng",
  per_vehicle_month: "xe mỗi tháng",
};

export const feeKindLabel = (kind: FeeKind) => FEE_KIND_LABEL[kind];

/** "3.500 ₫ mỗi kWh", or "Miễn phí" when the price is 0. */
export const formatFee = ({ price, unit }: PropertyFee) =>
  price === 0
    ? "Miễn phí"
    : `${formatMoney(price)} mỗi ${FEE_UNIT_LABEL[unit]}`;

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  admin: "Quản trị",
  landlord: "Chủ trọ",
  tenant: "Người tìm trọ",
};

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  visible: "Đang hiện",
  hidden_by_owner: "Bạn đã ẩn",
  hidden_by_admin: "Admin đã ẩn",
};

// Search that ignores accents and case, as `GET /listings?q=` does ("tan dinh" finds
// "Tân Định"). `đ` has no accent mark to strip, so it is mapped by hand.
export const foldAccents = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
