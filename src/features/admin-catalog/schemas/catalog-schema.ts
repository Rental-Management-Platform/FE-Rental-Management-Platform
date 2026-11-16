import { z } from "zod";
import type {
  AmenityBody,
  AmenityPatch,
  CatalogWard,
  Amenity,
  WardBody,
  WardPatch,
} from "@/lib/api/types";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.30). The limits are
// the ones of `POST /wards` and `POST /amenities`. Every box holds text and the API wants text,
// so there is no number to turn: the schema only trims and checks the shape.

const WARD_NAME_MESSAGE = "Tên cần từ 2 đến 100 ký tự.";
const AMENITY_NAME_MESSAGE = "Tên cần từ 2 đến 50 ký tự.";
const KEY_MESSAGE =
  "Khóa gồm chữ thường, số và gạch dưới, bắt đầu bằng chữ, dài 2 đến 30 ký tự.";

const wardName = z
  .string()
  .trim()
  .min(1, "Nhập tên.")
  .min(2, WARD_NAME_MESSAGE)
  .max(100, WARD_NAME_MESSAGE);

const amenityName = z
  .string()
  .trim()
  .min(1, "Nhập tên.")
  .min(2, AMENITY_NAME_MESSAGE)
  .max(50, AMENITY_NAME_MESSAGE);

// A new ward: the two keys and the two names. The keys are typed once, and cannot change.
export const wardCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Nhập mã phường, xã.")
    .regex(/^\d{5}$/, "Mã phường, xã gồm đúng 5 chữ số."),
  name: wardName,
  provinceCode: z
    .string()
    .trim()
    .min(1, "Nhập mã tỉnh, thành phố.")
    .regex(/^\d{2}$/, "Mã tỉnh, thành phố gồm đúng 2 chữ số."),
  provinceName: wardName,
});
export type WardCreateValues = z.infer<typeof wardCreateSchema>;

// A rename: only the two names. The keys are shown as text, never as boxes.
export const wardEditSchema = z.object({
  name: wardName,
  provinceName: wardName,
});
export type WardEditValues = z.infer<typeof wardEditSchema>;

export const amenityCreateSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Nhập khóa tiện ích.")
    .regex(/^[a-z][a-z0-9_]{1,29}$/, KEY_MESSAGE),
  name: amenityName,
});
export type AmenityCreateValues = z.infer<typeof amenityCreateSchema>;

export const amenityEditSchema = z.object({ name: amenityName });
export type AmenityEditValues = z.infer<typeof amenityEditSchema>;

/**
 * The starting values of a new ward. The province is the one the first ward of the list has, which
 * is the one almost every new ward belongs to, and stays a box the admin can change. With an empty
 * list the boxes start empty.
 */
export const emptyWard = (
  province: Pick<CatalogWard, "provinceCode" | "provinceName"> | undefined,
): WardCreateValues => ({
  code: "",
  name: "",
  provinceCode: province?.provinceCode ?? "",
  provinceName: province?.provinceName ?? "",
});

export const fromWard = (ward: CatalogWard): WardEditValues => ({
  name: ward.name,
  provinceName: ward.provinceName,
});

/** The body of a create: the four fields, and no box (the API does not take one). */
export const toWardBody = (values: WardCreateValues): WardBody => ({
  ...values,
});

/** Only the names that differ from the last copy the server sent. Empty when nothing changed. */
export const toWardPatch = (
  values: WardEditValues,
  current: CatalogWard,
): WardPatch => ({
  ...(values.name !== current.name && { name: values.name }),
  ...(values.provinceName !== current.provinceName && {
    provinceName: values.provinceName,
  }),
});

export const emptyAmenity: AmenityCreateValues = { key: "", name: "" };

export const fromAmenity = (amenity: Amenity): AmenityEditValues => ({
  name: amenity.name,
});

export const toAmenityBody = (values: AmenityCreateValues): AmenityBody => ({
  ...values,
});

/** The name when it changed, else `null`: a rename that changes nothing sends nothing. */
export const toAmenityPatch = (
  values: AmenityEditValues,
  current: Amenity,
): AmenityPatch | null =>
  values.name !== current.name ? { name: values.name } : null;
