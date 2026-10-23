// Fixed sample data for the screens under /dev/ui/screens. Every object has the shape of an
// answer in api-for-frontend.md (`GET /listings`, `GET /listings/:slugCode`, `GET /me/listings`,
// `GET /users`, `GET /plans`), typed with the real API types. No network call is made. The
// photos are all `null`, so `ImagePlaceholder` shows, and the names and addresses are made up.
import type {
  AccountType,
  AdminUserListItem,
  DateOnly,
  ListingDetail,
  Membership,
  OwnerListingSummary,
  Page,
  Plan,
  Property,
  PublicListingSummary,
  UserStatus,
  Ward,
} from "@/lib/api/types";
import { foldAccents } from "./sample-format";

const PROVINCE = { provinceCode: "79", provinceName: "Thành phố Hồ Chí Minh" };

export const WARDS: readonly Ward[] = [
  { code: "26743", name: "Phường Bến Thành", ...PROVINCE },
  { code: "26740", name: "Phường Tân Định", ...PROVINCE },
  { code: "26767", name: "Phường Phú Nhuận", ...PROVINCE },
  { code: "26995", name: "Phường Bình Thạnh", ...PROVINCE },
];

const [BEN_THANH, TAN_DINH, PHU_NHUAN, BINH_THANH] = WARDS;

const LANDLORDS = {
  nam: { id: "0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8d01", name: "Anh Nam" },
  lan: { id: "0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8d02", name: "Chị Lan" },
  hoa: { id: "0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8d03", name: "Nhà trọ Hoa Hồng" },
  // `landlord.name` is null until the landlord sets a name (api-for-frontend.md, 6.19).
  unnamed: { id: "0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8d04", name: null },
};

const pad = (n: number) => String(n).padStart(2, "0");

const slugify = (title: string) =>
  foldAccents(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

interface ListingSeed {
  title: string;
  price: number;
  areaM2: number;
  deposit: number | null;
  availableFrom: DateOnly | null;
  ward: Ward;
  addressText: string;
  landlord: PublicListingSummary["landlord"];
  /** Day of October 2026 the listing was posted. */
  day: number;
}

const makeListing = (n: number, seed: ListingSeed): PublicListingSummary => ({
  id: `0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c9d${pad(n)}`,
  code: `k7m2xq${pad(n)}`,
  slug: slugify(seed.title),
  title: seed.title,
  price: seed.price,
  areaM2: seed.areaM2,
  deposit: seed.deposit,
  availableFrom: seed.availableFrom,
  coverImageUrl: null,
  ward: { code: seed.ward.code, name: seed.ward.name },
  addressText: seed.addressText,
  fullAddress: `${seed.addressText}, ${seed.ward.name}, ${seed.ward.provinceName}`,
  landlord: seed.landlord,
  createdAt: `2026-10-${pad(seed.day)}T04:20:11.000Z`,
  isFavorite: null,
});

export const LISTINGS: readonly PublicListingSummary[] = [
  {
    title: "Phòng đẹp có gác gần chợ Bến Thành",
    price: 3_500_000,
    areaM2: 22.5,
    deposit: 3_500_000,
    availableFrom: "2026-11-01",
    ward: BEN_THANH,
    addressText: "12 Lê Lợi",
    landlord: LANDLORDS.nam,
    day: 16,
  },
  {
    title: "Phòng mới xây, ban công thoáng, gần ga metro",
    price: 4_200_000,
    areaM2: 25,
    deposit: 4_200_000,
    availableFrom: "2026-11-05",
    ward: TAN_DINH,
    addressText: "45 Hai Bà Trưng",
    landlord: LANDLORDS.lan,
    day: 20,
  },
  {
    title: "Phòng trọ sinh viên giá rẻ, giờ giấc tự do",
    price: 1_800_000,
    areaM2: 16,
    deposit: 1_800_000,
    availableFrom: null,
    ward: BINH_THANH,
    addressText: "78 Xô Viết Nghệ Tĩnh",
    landlord: LANDLORDS.hoa,
    day: 18,
  },
  {
    title: "Studio đủ nội thất, có máy giặt riêng",
    price: 6_500_000,
    areaM2: 32,
    deposit: 6_500_000,
    availableFrom: "2026-11-10",
    ward: PHU_NHUAN,
    addressText: "21 Phan Xích Long",
    landlord: LANDLORDS.nam,
    day: 22,
  },
  {
    title: "Phòng có cửa sổ lớn, yên tĩnh, an ninh suốt ngày đêm",
    price: 3_200_000,
    areaM2: 20,
    deposit: 3_200_000,
    availableFrom: "2026-10-30",
    ward: PHU_NHUAN,
    addressText: "9 Nguyễn Kiệm",
    landlord: LANDLORDS.lan,
    day: 19,
  },
  {
    title: "Phòng gác lửng gần trường đại học Hutech",
    price: 2_600_000,
    areaM2: 18,
    deposit: 2_000_000,
    availableFrom: "2026-11-01",
    ward: BINH_THANH,
    addressText: "102 Điện Biên Phủ",
    landlord: LANDLORDS.hoa,
    day: 14,
  },
  {
    title: "Căn hộ mini một phòng ngủ, có bếp riêng",
    price: 5_400_000,
    areaM2: 30,
    deposit: 5_400_000,
    availableFrom: null,
    ward: TAN_DINH,
    addressText: "88 Nguyễn Hữu Cầu",
    landlord: LANDLORDS.unnamed,
    day: 21,
  },
  {
    title: "Phòng trọ gần chợ, đi bộ ra trung tâm",
    price: 2_200_000,
    areaM2: 15,
    deposit: null,
    availableFrom: null,
    ward: BEN_THANH,
    addressText: "35 Cống Quỳnh",
    landlord: LANDLORDS.nam,
    day: 13,
  },
  {
    title: "Phòng rộng rãi cho hai người, có chỗ để xe",
    price: 4_800_000,
    areaM2: 28,
    deposit: 4_800_000,
    availableFrom: "2026-11-15",
    ward: BINH_THANH,
    addressText: "15 Nguyễn Gia Trí",
    landlord: LANDLORDS.lan,
    day: 17,
  },
  {
    title: "Phòng mới sơn lại, sạch sẽ, gần công viên",
    price: 3_000_000,
    areaM2: 19,
    deposit: 3_000_000,
    availableFrom: "2026-11-03",
    ward: PHU_NHUAN,
    addressText: "56 Hồ Văn Huê",
    landlord: LANDLORDS.unnamed,
    day: 12,
  },
  {
    title: "Phòng tầng trệt, tiện cho người lớn tuổi",
    price: 2_900_000,
    areaM2: 21,
    deposit: 2_900_000,
    availableFrom: null,
    ward: TAN_DINH,
    addressText: "17 Trần Quang Khải",
    landlord: LANDLORDS.hoa,
    day: 11,
  },
  {
    title: "Phòng có ban công nhìn ra đường Lê Lợi",
    price: 3_900_000,
    areaM2: 24,
    deposit: 3_900_000,
    availableFrom: "2026-11-08",
    ward: BEN_THANH,
    addressText: "64 Lê Lợi",
    landlord: LANDLORDS.nam,
    day: 10,
  },
  {
    title: "Phòng gần bến xe buýt, đi làm thuận tiện",
    price: 2_400_000,
    areaM2: 17,
    deposit: 2_400_000,
    availableFrom: null,
    ward: BINH_THANH,
    addressText: "230 Bạch Đằng",
    landlord: LANDLORDS.lan,
    day: 9,
  },
  {
    title: "Phòng duplex trần cao, nhiều ánh sáng",
    price: 5_900_000,
    areaM2: 35,
    deposit: 5_900_000,
    availableFrom: "2026-11-20",
    ward: PHU_NHUAN,
    addressText: "72 Nguyễn Văn Trỗi",
    landlord: LANDLORDS.hoa,
    day: 8,
  },
].map((seed, index) => makeListing(index + 1, seed));

export const LISTING_PAGE_SIZE = 6;

export type PriceRange = "all" | "under-2m" | "2m-4m" | "over-4m";
export type ListingSort = "newest" | "price_asc" | "price_desc";

export interface ListingFilters {
  q: string;
  /** A ward code, or "all". */
  wardCode: string;
  price: PriceRange;
  sort: ListingSort;
}

export const NO_LISTING_FILTERS: ListingFilters = {
  q: "",
  wardCode: "all",
  price: "all",
  sort: "newest",
};

const inPriceRange = (price: number, range: PriceRange) =>
  range === "all" ||
  (range === "under-2m" && price < 2_000_000) ||
  (range === "2m-4m" && price >= 2_000_000 && price <= 4_000_000) ||
  (range === "over-4m" && price > 4_000_000);

/**
 * What `GET /listings` would do with these query values, on the sample rows: every word of `q`
 * must be part of the title, the address or the ward name, ignoring accents and case.
 */
export function queryListings({
  q,
  wardCode,
  price,
  sort,
}: ListingFilters): PublicListingSummary[] {
  const words = foldAccents(q).split(/\s+/).filter(Boolean);
  const matches = LISTINGS.filter((listing) => {
    const haystack = foldAccents(`${listing.title} ${listing.fullAddress}`);
    return (
      words.every((word) => haystack.includes(word)) &&
      (wardCode === "all" || listing.ward.code === wardCode) &&
      inPriceRange(listing.price, price)
    );
  });
  const byNewest = (a: PublicListingSummary, b: PublicListingSummary) =>
    b.createdAt.localeCompare(a.createdAt);
  return matches.toSorted((a, b) =>
    sort === "price_asc"
      ? a.price - b.price || byNewest(a, b)
      : sort === "price_desc"
        ? b.price - a.price || byNewest(a, b)
        : byNewest(a, b),
  );
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): Page<T> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

// ---------- Listing detail ----------

const FIRST = LISTINGS[0];

const PROPERTY_HOA_HONG: ListingDetail["property"] = {
  id: "0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8d9e",
  name: "Nhà trọ Hoa Hồng",
  addressText: FIRST.addressText,
  fullAddress: FIRST.fullAddress,
  ward: BEN_THANH,
  latitude: 10.7721,
  longitude: 106.6983,
  fees: [
    { kind: "electricity", price: 3500, unit: "per_kwh", note: null },
    { kind: "water", price: 20000, unit: "per_m3", note: "Tính theo đồng hồ" },
    { kind: "internet", price: 100000, unit: "per_month", note: null },
    { kind: "parking", price: 100000, unit: "per_vehicle_month", note: null },
  ],
  amenities: [
    { key: "loft", name: "Gác lửng" },
    { key: "ac", name: "Máy lạnh" },
    { key: "wifi", name: "Wifi" },
    { key: "parking", name: "Chỗ để xe" },
    { key: "washer", name: "Máy giặt chung" },
  ],
};

/** `GET /listings/:slugCode` for a signed in viewer. A guest gets `landlord.phone` as null. */
export const LISTING_DETAIL: ListingDetail = {
  ...FIRST,
  description:
    "Phòng sạch sẽ, thoáng mát, có gác lửng rộng để đồ hoặc làm chỗ ngủ.\n\n" +
    "Giờ giấc tự do, không chung chủ. Cửa sổ hướng đông, buổi sáng nhiều nắng. " +
    "Đi bộ năm phút ra chợ Bến Thành, gần trạm xe buýt và ga metro.\n\n" +
    "Ưu tiên người đi làm hoặc sinh viên năm cuối, ở ổn định từ sáu tháng.",
  viewCount: 128,
  images: [],
  property: PROPERTY_HOA_HONG,
  isFavorite: null,
  landlord: { ...LANDLORDS.nam, phone: "0901234567" },
};

// ---------- My listings (landlord) ----------

export const SAMPLE_MEMBERSHIP: Pick<
  Membership,
  "state" | "trialDaysLeft" | "listingLimit"
> = { state: "trial", trialDaysLeft: 7, listingLimit: 3 };

type OwnerSeed = Pick<
  OwnerListingSummary,
  "status" | "moderationReason" | "viewCount"
>;

const toOwnerListing = (
  source: PublicListingSummary,
  { status, moderationReason, viewCount }: OwnerSeed,
): OwnerListingSummary => ({
  id: source.id,
  code: source.code,
  slug: source.slug,
  title: source.title,
  price: source.price,
  areaM2: source.areaM2,
  deposit: source.deposit,
  availableFrom: source.availableFrom,
  coverImageUrl: source.coverImageUrl,
  ward: source.ward,
  addressText: source.addressText,
  fullAddress: source.fullAddress,
  createdAt: source.createdAt,
  status,
  moderationReason,
  viewCount,
  // Set by `withPublicFlag`, which needs the whole list to rank the rows.
  isPublic: false,
});

/**
 * The visibility rule of api-for-frontend.md (6.19): a landlord shows at most `limit` listings
 * to guests, the oldest `visible` ones first. A `visible` listing past that is still `visible`
 * but not public. Hidden listings are never public.
 */
export function withPublicFlag(
  listings: readonly OwnerListingSummary[],
  limit: number,
): OwnerListingSummary[] {
  const publicIds = new Set(
    listings
      .filter((listing) => listing.status === "visible")
      .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit)
      .map((listing) => listing.id),
  );
  return listings.map((listing) => ({
    ...listing,
    isPublic: publicIds.has(listing.id),
  }));
}

const OWNER_NONE = { moderationReason: null } as const;

/** `GET /me/listings`: newest first, in every status, covering each label of the table. */
export const OWNER_LISTINGS: readonly OwnerListingSummary[] = withPublicFlag(
  [
    toOwnerListing(LISTINGS[3], {
      ...OWNER_NONE,
      status: "hidden_by_owner",
      viewCount: 42,
    }),
    toOwnerListing(LISTINGS[0], {
      ...OWNER_NONE,
      status: "visible",
      viewCount: 128,
    }),
    toOwnerListing(LISTINGS[5], {
      status: "hidden_by_admin",
      moderationReason:
        "Mô tả và ảnh không khớp với phòng thật, đã có người phản ánh.",
      viewCount: 87,
    }),
    toOwnerListing(LISTINGS[7], {
      ...OWNER_NONE,
      status: "visible",
      viewCount: 205,
    }),
    toOwnerListing(LISTINGS[9], {
      ...OWNER_NONE,
      status: "hidden_by_owner",
      viewCount: 19,
    }),
    toOwnerListing(LISTINGS[11], {
      ...OWNER_NONE,
      status: "visible",
      viewCount: 64,
    }),
    toOwnerListing(LISTINGS[12], {
      ...OWNER_NONE,
      status: "visible",
      viewCount: 33,
    }),
  ],
  SAMPLE_MEMBERSHIP.listingLimit,
);

// ---------- Post listing ----------

export const SAMPLE_PROPERTIES: readonly Pick<
  Property,
  "id" | "name" | "fullAddress"
>[] = [
  {
    id: PROPERTY_HOA_HONG.id,
    name: PROPERTY_HOA_HONG.name,
    fullAddress: PROPERTY_HOA_HONG.fullAddress,
  },
  {
    id: "0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c8d9f",
    name: "Nhà trọ Phú Nhuận",
    fullAddress: "21 Phan Xích Long, Phường Phú Nhuận, Thành phố Hồ Chí Minh",
  },
];

// ---------- Admin users ----------

export const USER_PAGE_SIZE = 8;

/** The admin who is signed in on the sample screen: this row has no lock button. */
export const CURRENT_ADMIN_ID = "0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c0001";

const makeUser = (
  n: number,
  user: Omit<AdminUserListItem, "id" | "status" | "lockedReason"> &
    Partial<Pick<AdminUserListItem, "lockedReason">>,
): AdminUserListItem => ({
  id: `0192f1c2-7a4b-7c3e-9d1a-3b5f6a7c${pad(n).padStart(4, "0")}`,
  status: user.lockedReason ? "locked" : "active",
  lockedReason: user.lockedReason ?? null,
  ...user,
});

/** `GET /users`: the newest account first, every type and status, no fixed `sort`. */
export const USERS: readonly AdminUserListItem[] = [
  makeUser(12, {
    email: "thu.pham@example.com",
    name: "Phạm Anh Thư",
    phone: null,
    accountType: "tenant",
    createdAt: "2026-10-23T09:12:00.000Z",
  }),
  makeUser(11, {
    email: "quoc.bui@example.com",
    name: null,
    phone: "0938123456",
    accountType: "landlord",
    createdAt: "2026-10-22T14:30:00.000Z",
  }),
  makeUser(10, {
    email: "mai.le@example.com",
    name: "Lê Thị Mai",
    phone: "0977456123",
    accountType: "tenant",
    createdAt: "2026-10-20T02:05:00.000Z",
  }),
  makeUser(9, {
    email: "nam@example.com",
    name: "Nguyễn Văn Nam",
    phone: "0901234567",
    accountType: "landlord",
    createdAt: "2026-10-05T03:00:00.000Z",
    lockedReason: "Đăng tin giả mạo",
  }),
  makeUser(8, {
    email: "linh.vo@example.com",
    name: "Võ Khánh Linh",
    phone: null,
    accountType: "tenant",
    createdAt: "2026-10-04T11:45:00.000Z",
  }),
  makeUser(7, {
    email: "hoa.tran@example.com",
    name: "Trần Thị Hoa",
    phone: "0912345678",
    accountType: "landlord",
    createdAt: "2026-10-03T08:20:00.000Z",
  }),
  makeUser(6, {
    email: "khoa.dang@example.com",
    name: "Đặng Anh Khoa",
    phone: "0965432100",
    accountType: "tenant",
    createdAt: "2026-10-02T16:10:00.000Z",
    lockedReason: "Nhiều người báo cáo gửi tin nhắn quấy rối",
  }),
  makeUser(5, {
    email: "lan.ngo@example.com",
    name: "Ngô Thị Lan",
    phone: "0988776655",
    accountType: "landlord",
    createdAt: "2026-09-29T05:00:00.000Z",
  }),
  makeUser(4, {
    email: "tuan.hoang@example.com",
    name: "Hoàng Minh Tuấn",
    phone: null,
    accountType: "tenant",
    createdAt: "2026-09-27T13:35:00.000Z",
  }),
  makeUser(3, {
    email: "an.truong@example.com",
    name: "Trương Quốc An",
    phone: "0905111222",
    accountType: "landlord",
    createdAt: "2026-09-20T07:50:00.000Z",
  }),
  makeUser(2, {
    email: "ha.do@example.com",
    name: "Đỗ Thu Hà",
    phone: "0944001122",
    accountType: "admin",
    createdAt: "2026-09-10T01:15:00.000Z",
  }),
  {
    id: CURRENT_ADMIN_ID,
    email: "admin@example.com",
    name: "Quản trị viên",
    phone: null,
    accountType: "admin",
    status: "active",
    lockedReason: null,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
];

export interface UserFilters {
  q: string;
  accountType: AccountType | "all";
  status: UserStatus | "all";
}

export const NO_USER_FILTERS: UserFilters = {
  q: "",
  accountType: "all",
  status: "all",
};

/**
 * What `GET /users` does with these query values: `q` is part of the email, the name or the
 * phone, ignoring case but NOT accents (api-for-frontend.md, 6.34), and spaces in a phone
 * number do not matter. Both filters apply together. The order stays newest first.
 */
export function queryUsers(
  rows: readonly AdminUserListItem[],
  { q, accountType, status }: UserFilters,
): AdminUserListItem[] {
  const text = q.trim().toLowerCase();
  const digits = text.replace(/[\s.-]/g, "");
  return rows.filter(
    (user) =>
      (text === "" ||
        user.email.toLowerCase().includes(text) ||
        (user.name ?? "").toLowerCase().includes(text) ||
        (user.phone ?? "").includes(/^\d+$/.test(digits) ? digits : text)) &&
      (accountType === "all" || user.accountType === accountType) &&
      (status === "all" || user.status === status),
  );
}

// ---------- Pricing ----------

/** `GET /plans`: cheapest first, as the API sorts them. */
export const PLANS: readonly Plan[] = [
  {
    id: "01a152f1-93f8-7a52-81cf-e8a1248f09bf",
    name: "Cơ bản",
    price: 99000,
    maxListings: 5,
    durationDays: 30,
  },
  {
    id: "01a152f1-93fb-7587-bfe8-eca047ac7e0e",
    name: "Nâng cao",
    price: 199000,
    maxListings: 15,
    durationDays: 30,
  },
  {
    id: "01a152f1-93fd-7a39-9f04-0e4e7f5b2c11",
    name: "Chuyên nghiệp",
    price: 399000,
    maxListings: 50,
    durationDays: 30,
  },
];
