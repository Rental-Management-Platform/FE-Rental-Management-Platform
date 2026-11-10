import type { Page, SavedListing } from "@/lib/api/types";

// Fake saved listings for the favorites preview in `/dev/ui`. Every row has `coverImageUrl` null,
// because the card only accepts a path of the API's media folder and the gallery makes no network
// call. The shapes are those of `GET /me/favorites` (api-for-frontend.md, 6.33).

const LANDLORD = {
  id: "00000000-0000-4000-8000-0000000000a1",
  name: "Nguyễn Thị Hồng",
};

export const SAVED_ROWS: readonly SavedListing[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    code: "AB12CD34",
    slug: "phong-co-gac-gan-cho-tan-dinh",
    title: "Phòng có gác gần chợ Tân Định",
    price: 3500000,
    areaM2: 22.5,
    deposit: 3500000,
    availableFrom: "2026-11-15",
    coverImageUrl: null,
    ward: { code: "26734", name: "Phường Tân Định" },
    addressText: "12 Đặng Dung",
    fullAddress: "12 Đặng Dung, Phường Tân Định, Thành phố Hồ Chí Minh",
    landlord: LANDLORD,
    createdAt: "2026-10-30T03:00:00.000Z",
    favoritedAt: "2026-11-09T08:30:00.000Z",
    isFavorite: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    code: "EF56GH78",
    slug: "can-ho-mini-day-du-noi-that-nguyen-dinh-chieu",
    title:
      "Căn hộ mini đầy đủ nội thất, có ban công thoáng, ngay mặt tiền đường Nguyễn Đình Chiểu, gần chợ và trường học",
    price: 6200000,
    areaM2: 30,
    deposit: null,
    availableFrom: null,
    coverImageUrl: null,
    ward: { code: "26740", name: "Phường Võ Thị Sáu" },
    addressText: "128/12/5 Nguyễn Đình Chiểu",
    fullAddress:
      "Số 128/12/5 Hẻm 45 đường Nguyễn Đình Chiểu, Khu phố 3, Phường Võ Thị Sáu, Thành phố Hồ Chí Minh",
    landlord: { ...LANDLORD, name: null },
    createdAt: "2026-10-12T03:00:00.000Z",
    favoritedAt: "2026-11-02T14:05:00.000Z",
    isFavorite: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    code: "JK90LM12",
    slug: "phong-don-15m2-cho-sinh-vien",
    title: "Phòng đơn 15 m² cho sinh viên",
    price: 2800000,
    areaM2: 15,
    deposit: 2800000,
    availableFrom: "2026-12-01",
    coverImageUrl: null,
    ward: { code: "26743", name: "Phường Bến Thành" },
    addressText: "45 Lê Lợi",
    fullAddress: "45 Lê Lợi, Phường Bến Thành, Thành phố Hồ Chí Minh",
    landlord: LANDLORD,
    createdAt: "2026-10-20T03:00:00.000Z",
    favoritedAt: "2026-10-28T01:15:00.000Z",
    isFavorite: true,
  },
];

/** A page of `GET /me/favorites` with the sample rows. `total` says there are more pages. */
export const SAVED_PAGE: Page<SavedListing> = {
  items: [...SAVED_ROWS],
  total: 25,
  page: 1,
  pageSize: 12,
};

/** Nothing saved. */
export const SAVED_NONE: Page<SavedListing> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 12,
};

/** A page past the last one: no rows, but the total still says 25. */
export const SAVED_PAST_END: Page<SavedListing> = {
  items: [],
  total: 25,
  page: 5,
  pageSize: 12,
};
