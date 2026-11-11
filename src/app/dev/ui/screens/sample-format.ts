// Text helpers that only the sample screens use. Money, area and dates moved to
// `src/lib/format.ts` with the first feature that shows a price (spec 0006, AC-13), and the fee
// words (`feeKindLabel`, `formatFee`) with the fees on the real listing page (scope #11).
import type { AccountType, ListingStatus } from "@/lib/api/types";

const COUNT = new Intl.NumberFormat("vi-VN");

/** 1248 becomes "1.248". */
export const formatCount = (n: number) => COUNT.format(n);

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
