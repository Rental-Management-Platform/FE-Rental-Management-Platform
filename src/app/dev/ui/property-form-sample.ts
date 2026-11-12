import type { AmenityCatalog } from "@/features/amenities/amenity-catalog";
import type { PropertyInput } from "@/features/property/schemas/property-schema";
import { createApiError, networkError, type ApiError } from "@/lib/api/errors";
import type { Amenity } from "@/lib/api/types";

// Fake data for the property form section of `/dev/ui` (spec 0017, AC-16): fixed objects typed
// with the API types, no network call and no randomness, so the page reads the same on every load.

// The three fields the section does not draw. They only have to pass the schema, so a "Gửi thử"
// reaches the body and not a message about a box that is not on the page.
const GENERAL = {
  name: "Nhà trọ mẫu",
  addressText: "12 Lê Lợi",
  wardCode: "27316",
  // No pin: the two coordinate boxes are empty (spec 0011).
  latitude: "",
  longitude: "",
} as const;

/** The amenities of the seed catalog, sorted by name the way `GET /amenities` sorts them. */
export const SAMPLE_AMENITIES: readonly Amenity[] = [
  { key: "balcony", name: "Ban công" },
  { key: "kitchen", name: "Bếp" },
  { key: "security_camera", name: "Camera an ninh" },
  { key: "parking", name: "Chỗ để xe" },
  { key: "furnished", name: "Có nội thất" },
  { key: "loft", name: "Gác lửng" },
  { key: "free_hours", name: "Giờ giấc tự do" },
  { key: "washing_machine", name: "Máy giặt" },
  { key: "air_conditioner", name: "Máy lạnh" },
  { key: "water_heater", name: "Máy nước nóng" },
  { key: "private_bathroom", name: "Phòng vệ sinh riêng" },
  { key: "elevator", name: "Thang máy" },
  { key: "wifi", name: "Wifi" },
];

/** A catalog longer than 30, so the limit can be reached: the seed list and 19 more. */
export const MANY_AMENITIES: readonly Amenity[] = [
  ...SAMPLE_AMENITIES,
  ...Array.from({ length: 19 }, (_, index) => ({
    key: `extra_${index + 14}`,
    name: `Tiện ích mẫu ${index + 14}`,
  })),
];

export const READY_CATALOG: AmenityCatalog = {
  status: "ready",
  amenities: SAMPLE_AMENITIES,
};
export const MANY_CATALOG: AmenityCatalog = {
  status: "ready",
  amenities: MANY_AMENITIES,
};
export const EMPTY_CATALOG: AmenityCatalog = {
  status: "ready",
  amenities: [],
};
export const LOADING_CATALOG: AmenityCatalog = { status: "loading" };
export const ERROR_CATALOG: AmenityCatalog = {
  status: "error",
  error: networkError(),
  retry: () => undefined,
};

/** Nothing added yet: the zone as it opens. */
export const NO_ROWS: PropertyInput = {
  ...GENERAL,
  fees: [],
  amenityKeys: [],
};

export const THREE_ROWS: PropertyInput = {
  ...GENERAL,
  fees: [
    { kind: "electricity", price: "3800", unit: "per_kwh", note: "" },
    {
      kind: "water",
      price: "20000",
      unit: "per_m3",
      note: "Tính theo đồng hồ",
    },
    { kind: "internet", price: "100000", unit: "per_month", note: "" },
  ],
  amenityKeys: [],
};

/** All six kinds, so "Thêm khoản phí" is off and its reason line shows. */
export const SIX_ROWS: PropertyInput = {
  ...GENERAL,
  fees: [
    ...THREE_ROWS.fees,
    { kind: "parking", price: "150000", unit: "per_vehicle_month", note: "" },
    {
      kind: "service",
      price: "50000",
      unit: "per_month",
      note: "Vệ sinh khu vực chung",
    },
    {
      kind: "other",
      price: "0",
      unit: "per_month",
      note: "Miễn phí cho người thuê dài hạn",
    },
  ],
  amenityKeys: [],
};

/** One row for each reading of the line under the price: a hint, money, "Miễn phí", and nothing. */
export const READING_ROWS: PropertyInput = {
  ...GENERAL,
  fees: [
    { kind: "electricity", price: "", unit: "per_kwh", note: "" },
    { kind: "water", price: "3800", unit: "per_m3", note: "" },
    { kind: "internet", price: "0", unit: "per_month", note: "" },
    { kind: "parking", price: "3.8", unit: "per_vehicle_month", note: "" },
  ],
  amenityKeys: [],
};

// Keys are listed in catalog order, the way the form keeps them.
export const SOME_AMENITIES: PropertyInput = {
  ...NO_ROWS,
  amenityKeys: ["air_conditioner", "wifi"],
};

/** Thirty ticked out of 32: the rest are off and the status line says the limit is reached. */
export const FULL_AMENITIES: PropertyInput = {
  ...NO_ROWS,
  amenityKeys: MANY_AMENITIES.slice(0, 30).map((amenity) => amenity.key),
};

/** A form that starts with values, the way the edit form of #12 will (spec 0017, AC-13). */
export const PREFILLED: PropertyInput = {
  ...SIX_ROWS,
  amenityKeys: ["kitchen", "washing_machine", "air_conditioner", "wifi"],
};

export interface SampleFailure {
  label: string;
  make: () => ApiError;
}

// What the backend could answer to a save of the fees and amenities. Each one is handed to the
// same code the create form uses, so the sample shows where each message lands (AC-9).
export const SAMPLE_FAILURES: readonly SampleFailure[] = [
  {
    label: "400 · lỗi ở dòng 2 (fees.1.price, fees.1.note)",
    make: () =>
      createApiError({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Dữ liệu chưa hợp lệ.",
        errors: [
          {
            field: "fees.1.price",
            code: "OUT_OF_RANGE",
            message: "Giá phải từ 0 đến 100.000.000 đồng.",
          },
          {
            field: "fees.1.note",
            code: "TOO_LONG",
            message: "Ghi chú tối đa 100 ký tự.",
          },
        ],
      }),
  },
  {
    label: "400 · fees (trùng loại)",
    make: () =>
      createApiError({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Dữ liệu chưa hợp lệ.",
        errors: [
          {
            field: "fees",
            code: "DUPLICATE_KIND",
            message: "Mỗi loại phí chỉ được khai một lần.",
          },
        ],
      }),
  },
  {
    label: "400 · amenityKeys (quá 30)",
    make: () =>
      createApiError({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Dữ liệu chưa hợp lệ.",
        errors: [
          {
            field: "amenityKeys",
            code: "TOO_MANY",
            message: "Chỉ được chọn tối đa 30 tiện ích.",
          },
        ],
      }),
  },
  {
    label: "400 · ô lạ (thông báo chung)",
    make: () =>
      createApiError({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Dữ liệu chưa hợp lệ.",
        errors: [
          {
            field: "latitude",
            code: "INVALID",
            message: "Tọa độ không hợp lệ.",
          },
        ],
      }),
  },
];
