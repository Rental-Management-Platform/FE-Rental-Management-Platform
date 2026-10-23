// Text helpers for the sample screens. Money, area and dates use `vi-VN` and
// `Asia/Ho_Chi_Minh`, as the project rules say. This file stays here until the first feature
// that shows a price adds `src/lib/format.ts`; the screens then switch to that one (spec 0003).
import type {
  AccountType,
  DateOnly,
  FeeKind,
  FeeUnit,
  IsoDateTime,
  ListingStatus,
  PropertyFee,
} from "@/lib/api/types";

const TIME_ZONE = "Asia/Ho_Chi_Minh";

const MONEY = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const AREA = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const COUNT = new Intl.NumberFormat("vi-VN");
const DAY = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** 3500000 becomes "3.500.000 ₫". */
export const formatMoney = (dong: number) => MONEY.format(dong);

/** 22.5 becomes "22,5 m²". */
export const formatArea = (m2: number) => `${AREA.format(m2)} m²`;

/** 1248 becomes "1.248". */
export const formatCount = (n: number) => COUNT.format(n);

/** A UTC instant from the API, shown as a day in Vietnam: "16/10/2026". */
export const formatDateTime = (iso: IsoDateTime) => DAY.format(new Date(iso));

/**
 * A date without a time ("2026-11-01"). It is read as midnight in Vietnam, so it never moves
 * to the day before when the viewer is in another time zone.
 */
export const formatDateOnly = (date: DateOnly) =>
  DAY.format(new Date(`${date}T00:00:00+07:00`));

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
