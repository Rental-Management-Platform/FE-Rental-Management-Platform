// Copied by hand from api-for-frontend.md, "Phụ lục B. Kiểu TypeScript của phản hồi" and the
// request bodies listed under it (backend state of 2026-10-23). When the API changes, update
// this file from the contract.
//
// Two changes from the contract text: every type is exported, and the contract's `ApiError`
// interface is named `ApiErrorBody` here so it does not clash with the thrown `ApiError` in
// errors.ts. `ErrorCode` is written as a list so errors.ts can tell a known code from an
// unknown one at run time.

// ---------- Shared types ----------
export type Uuid = string;
export type IsoDateTime = string; // "2026-10-19T03:00:00.000Z", always UTC
export type DateOnly = string; // "YYYY-MM-DD", no time, does not move with the time zone
export type AccountType = "admin" | "landlord" | "tenant";
export type UserStatus = "active" | "locked";
export type PermissionKey = string; // "module:action", for example "favorite:create"

export interface Page<T> {
  items: T[];
  total: number; // all rows that match, not the rows of this page
  page: number;
  pageSize: number;
}

export interface FieldError {
  field: string; // a nested field looks like "fees.0.price"
  code: string;
  message: string; // Vietnamese
}

export interface ApiErrorBody {
  status: number;
  code: ErrorCode;
  message: string; // Vietnamese, can be shown as it is
  // Present on VALIDATION_FAILED and on a few errors that name the wrong field (WARD_UNKNOWN,
  // AMENITY_UNKNOWN, PERMISSION_UNKNOWN, PERMISSION_ADMIN_ONLY, PLAN_NAME_TAKEN). A field can repeat.
  errors?: FieldError[];
  requestId: string;
}

export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "INVALID_ID",
  "BAD_REQUEST",
  "PAYLOAD_TOO_LARGE",
  "RATE_LIMITED",
  "TOKEN_MISSING",
  "TOKEN_INVALID",
  "TOKEN_EXPIRED",
  "UNAUTHORIZED",
  "INVALID_CREDENTIALS",
  "REFRESH_TOKEN_MISSING",
  "SESSION_REVOKED",
  "SESSION_EXPIRED",
  "ACCOUNT_LOCKED",
  "ORIGIN_NOT_ALLOWED",
  "PERMISSION_DENIED",
  "NOT_RESOURCE_OWNER",
  "FORBIDDEN",
  "NOT_FOUND",
  "EMAIL_TAKEN",
  "PHONE_TAKEN",
  "RESET_TOKEN_INVALID",
  "CURRENT_PASSWORD_WRONG",
  "PERMISSION_UNKNOWN",
  "PERMISSION_ADMIN_ONLY",
  "SYSTEM_TYPE_PROTECTED",
  "ACCOUNT_TYPE_NOT_FOUND",
  "USER_NOT_FOUND",
  "CANNOT_LOCK_SELF",
  "ACCOUNT_ALREADY_LOCKED",
  "ACCOUNT_NOT_LOCKED",
  "WARD_UNKNOWN",
  "AMENITY_UNKNOWN",
  "CATALOG_CODE_TAKEN",
  "CATALOG_IN_USE",
  "PROPERTY_NOT_FOUND",
  "PROPERTY_HAS_LISTINGS",
  "LISTING_NOT_FOUND",
  "LISTING_STATE_INVALID",
  "LISTING_HIDDEN_BY_ADMIN",
  "LISTING_IMAGE_LIMIT",
  "IMAGE_INVALID",
  "MEMBERSHIP_REQUIRED",
  "LISTING_QUOTA_REACHED",
  "PLAN_NOT_FOUND",
  "PLAN_NAME_TAKEN",
  "PLAN_IN_USE",
  "PLAN_INACTIVE",
  "ORDER_NOT_FOUND",
  "ORDER_STATE_INVALID",
  "LANDLORD_NOT_FOUND",
  "CANNOT_FOLLOW_SELF",
  "DB_UNAVAILABLE",
  "INTERNAL_ERROR",
  "HTTP_ERROR",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

// ---------- Sign in, accounts ----------
export interface TokenResponse {
  accessToken: string;
  expiresIn: number; // seconds; login, refresh
}
export interface User {
  id: Uuid;
  email: string;
  name: string | null;
  accountType: AccountType;
  phone: string | null;
  status: UserStatus;
}
export interface RegisterResponse extends TokenResponse {
  user: User;
}
export interface MeResponse {
  user: User;
  permissions: PermissionKey[]; // every action spelled out
}
export interface MessageResponse {
  message: string; // forgot-password
}
export interface Profile {
  id: Uuid;
  email: string;
  name: string | null;
  phone: string | null;
  accountType: AccountType;
  status: UserStatus;
  createdAt: IsoDateTime;
}
export interface AdminUserListItem extends Profile {
  lockedReason: string | null;
}
export interface PermissionCatalogEntry {
  module: string;
  actions: string[];
  ownerScoped: boolean;
  adminActions: string[];
}
export interface AccountTypeView {
  key: AccountType;
  name: string;
  description: string | null;
  permissions: PermissionKey[];
}

// ---------- Catalogs, properties ----------
export interface Ward {
  code: string;
  name: string;
  provinceCode: string;
  provinceName: string;
}
export interface Amenity {
  key: string;
  name: string;
}
export type FeeKind =
  "electricity" | "water" | "internet" | "parking" | "service" | "other";
export type FeeUnit =
  "per_kwh" | "per_m3" | "per_month" | "per_person_month" | "per_vehicle_month";
export interface PropertyFee {
  kind: FeeKind;
  price: number;
  unit: FeeUnit;
  note: string | null;
}
export interface Property {
  id: Uuid;
  name: string;
  addressText: string;
  fullAddress: string;
  ward: Ward;
  latitude: number | null;
  longitude: number | null;
  fees: PropertyFee[]; // fixed order: electricity, water, internet, parking, service, other
  amenities: Amenity[]; // by Vietnamese name
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}
export interface PropertyListItem extends Property {
  listingCount: number;
}

// ---------- Listings ----------
export type ListingStatus = "visible" | "hidden_by_owner" | "hidden_by_admin";
export interface ListingImage {
  id: Uuid;
  position: number;
  url: string; // relative: "/api/v1/media/public/<uuid>.<extension>"
}
export interface ListingSummary {
  id: Uuid;
  code: string;
  slug: string;
  title: string;
  price: number;
  areaM2: number;
  deposit: number | null;
  availableFrom: DateOnly | null;
  coverImageUrl: string | null;
  ward: Pick<Ward, "code" | "name">;
  addressText: string;
  fullAddress: string;
  landlord: { id: Uuid; name: string | null };
  createdAt: IsoDateTime;
}
// GET /listings and GET /landlords/:id/listings
export interface PublicListingSummary extends ListingSummary {
  isFavorite: boolean | null;
}
// GET /me/favorites
export interface SavedListing extends ListingSummary {
  favoritedAt: IsoDateTime;
  isFavorite: true;
}
// GET /moderation/listings and the hide/unhide result for admins (no isPublic, no phone)
export interface ModerationListing extends ListingSummary {
  status: ListingStatus;
  moderationReason: string | null;
  viewCount: number;
}
export type PropertyInListing = Pick<
  Property,
  | "id"
  | "name"
  | "addressText"
  | "fullAddress"
  | "ward"
  | "latitude"
  | "longitude"
  | "fees"
  | "amenities"
>;
// GET /listings/:slugCode
export interface ListingDetail extends Omit<ListingSummary, "landlord"> {
  description: string;
  viewCount: number;
  images: ListingImage[];
  property: PropertyInListing;
  isFavorite: boolean | null;
  landlord: { id: Uuid; name: string | null; phone: string | null }; // phone is null for a guest
}
// GET /me/listings
export interface OwnerListingSummary extends Omit<ListingSummary, "landlord"> {
  status: ListingStatus;
  moderationReason: string | null;
  viewCount: number;
  isPublic: boolean;
}
// GET /me/listings/:id and the result of POST, PATCH, hide, show
export interface OwnerListingDetail extends Omit<
  ListingDetail,
  "landlord" | "isFavorite"
> {
  status: ListingStatus;
  moderationReason: string | null;
  isPublic: boolean;
}
export interface FavoriteResult {
  listingId: Uuid;
  isFavorite: boolean; // POST/DELETE /listings/:id/favorite
}

// ---------- Landlord profile ----------
export interface LandlordProfile {
  id: Uuid;
  name: string | null;
  joinedAt: IsoDateTime;
  followerCount: number;
  totalViewCount: number;
  publicListingCount: number;
  isFollowing: boolean | null; // null for a guest
}

// ---------- Trial, plans, orders ----------
export type MembershipState = "plan" | "trial" | "expired";
export interface Subscription {
  orderCode: string;
  planName: string;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  daysLeft: number;
  paidUntil: IsoDateTime;
}
export interface Membership {
  state: MembershipState;
  trialEndsAt: IsoDateTime | null;
  trialDaysLeft: number | null;
  subscription: Subscription | null;
  listingLimit: number;
  visibleCount: number;
  remaining: number;
  overLimitCount: number;
}
export interface Plan {
  id: Uuid;
  name: string;
  price: number;
  maxListings: number;
  durationDays: number;
}
export interface AdminPlan extends Plan {
  isActive: boolean;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}
export type OrderStatus = "pending" | "paid" | "cancelled";
export interface Order {
  id: Uuid;
  code: string;
  planId: Uuid;
  planName: string;
  price: number;
  maxListings: number;
  durationDays: number; // the four fields above are fixed when the order is made
  status: OrderStatus;
  paidAt: IsoDateTime | null;
  cancelledAt: IsoDateTime | null;
  startsAt: IsoDateTime | null;
  endsAt: IsoDateTime | null;
  createdAt: IsoDateTime;
}
export interface AdminOrder extends Order {
  landlord: { id: Uuid; name: string | null; email: string };
}
export interface AdminOrderPage extends Page<AdminOrder> {
  summary: { paidCount: number; paidAmount: number };
}
export interface RevenueResponse {
  from: DateOnly | null;
  to: DateOnly | null;
  groupBy: "day" | "month";
  timeZone: "Asia/Ho_Chi_Minh";
  paidCount: number;
  paidAmount: number;
  byPlan: {
    planId: Uuid;
    planName: string;
    paidCount: number;
    paidAmount: number;
  }[];
  series: { period: string; paidCount: number; paidAmount: number }[]; // "YYYY-MM-DD" or "YYYY-MM"; sparse
}

// ---------- System settings ----------
export interface Setting {
  key: "trial_days" | "trial_listing_limit";
  value: number;
  min: number;
  max: number;
  updatedAt: IsoDateTime | null;
  updatedBy: Uuid | null;
}

// ---------- Common request bodies ----------
export interface RegisterBody {
  email: string;
  password: string;
  name?: string;
  accountType: "landlord" | "tenant";
  phone?: string; // required for a landlord
}
export interface LoginBody {
  email: string;
  password: string;
}
export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}
export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}
export interface ReasonBody {
  reason: string; // lock, unlock, moderation hide, unhide
}
export interface UpdateProfileBody {
  name?: string | null;
  phone?: string | null;
}
export interface PropertyBody {
  name: string;
  addressText: string;
  wardCode: string;
  latitude?: number | null;
  longitude?: number | null;
  fees?: PropertyFee[];
  amenityKeys?: string[];
} // PATCH: every field optional
export interface ListingBody {
  title: string;
  description: string;
  price: number;
  areaM2: number;
  deposit?: number | null;
  availableFrom?: DateOnly | null;
} // PATCH: every field optional
export interface PlanBody {
  name: string;
  price: number;
  maxListings: number;
  durationDays?: number;
  isActive?: boolean;
} // PATCH: every field optional
export interface CreateOrderBody {
  planId: Uuid;
}
export interface UpdateSettingBody {
  value: number;
}
export interface UpdateAccountTypeBody {
  permissions: PermissionKey[]; // replaces the whole list
}
