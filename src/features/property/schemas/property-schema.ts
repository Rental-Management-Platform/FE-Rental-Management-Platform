import { z } from "zod";
import { MAX_AMENITIES } from "@/features/amenities/amenity-keys";
import { pinFieldIssues } from "@/features/location-map/fields";
import { pinFromFields, roundPin } from "@/features/location-map/pin";
import type { CatalogWard, PropertyBody } from "@/lib/api/types";
import {
  FEE_KINDS,
  FEE_UNITS,
  MAX_FEE_NOTE_LENGTH,
  MAX_FEE_PRICE,
  MAX_FEES,
  toFeesBody,
} from "../fees";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.17). The limits
// are the ones of `POST /properties`.

const NAME_MESSAGE = "Tên nhà trọ cần từ 2 đến 100 ký tự.";
const ADDRESS_MESSAGE = "Số nhà và tên đường cần từ 5 đến 200 ký tự.";

// The form holds an empty string until a ward is chosen, and a ward `code` is five digits.
const WARD_MESSAGE = "Chọn phường hoặc xã.";

// Fees and amenities (spec 0017, AC-7). Each message sits under the box it is about, except the
// two "too many" ones, which sit in the line of their zone.
const FEE_PRICE_EMPTY_MESSAGE = "Nhập giá, nhập 0 nếu miễn phí.";
const FEE_PRICE_DIGITS_MESSAGE =
  "Chỉ nhập chữ số, không dùng dấu chấm hay dấu phẩy.";
const FEE_PRICE_RANGE_MESSAGE = "Giá từ 0 đến 100.000.000 đồng.";
const FEE_NOTE_MESSAGE = "Ghi chú tối đa 100 ký tự.";
const FEE_KIND_TWICE_MESSAGE = "Mỗi loại phí chỉ khai một lần.";
const FEES_TOO_MANY_MESSAGE = "Tối đa 6 khoản phí.";
const AMENITIES_TOO_MANY_MESSAGE = "Chọn tối đa 30 tiện ích.";
const AMENITY_TWICE_MESSAGE = "Mỗi tiện ích chỉ chọn một lần.";

// The price is typed as text and becomes a whole number only when it is digits and in range. An
// empty box is an error and never a lost row: a row with no price is not skipped.
const feePriceSchema = z
  .string()
  .trim()
  .min(1, FEE_PRICE_EMPTY_MESSAGE)
  .regex(/^\d+$/, FEE_PRICE_DIGITS_MESSAGE)
  .transform(Number)
  .pipe(
    z
      .number()
      .int(FEE_PRICE_RANGE_MESSAGE)
      .min(0, FEE_PRICE_RANGE_MESSAGE)
      .max(MAX_FEE_PRICE, FEE_PRICE_RANGE_MESSAGE),
  );

const feeRowSchema = z.object({
  kind: z.enum(FEE_KINDS),
  price: feePriceSchema,
  unit: z.enum(FEE_UNITS),
  note: z.string().trim().max(MAX_FEE_NOTE_LENGTH, FEE_NOTE_MESSAGE),
});

/**
 * The fee rows. At most six, and one row for each kind: a second row of a kind gets its message
 * under its own "Loại phí" box (the select already leaves a used kind out, so this is the safety
 * net). Exported on its own so a form that also has coordinates (spec 0011) can join the two
 * schemas with one line.
 */
export const feesSchema = z
  .array(feeRowSchema)
  .max(MAX_FEES, FEES_TOO_MANY_MESSAGE)
  .superRefine((rows, ctx) => {
    const seen = new Set<string>();
    rows.forEach(({ kind }, index) => {
      if (seen.has(kind)) {
        ctx.addIssue({
          code: "custom",
          message: FEE_KIND_TWICE_MESSAGE,
          path: [index, "kind"],
        });
      }
      seen.add(kind);
    });
  });

/** The amenity keys the person ticked: at most 30, none twice. Exported on its own, like `feesSchema`. */
export const amenityKeysSchema = z
  .array(z.string())
  .max(MAX_AMENITIES, AMENITIES_TOO_MANY_MESSAGE)
  .refine((keys) => new Set(keys).size === keys.length, {
    message: AMENITY_TWICE_MESSAGE,
  });

const propertyShape = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nhập tên nhà trọ.")
    .min(2, NAME_MESSAGE)
    .max(100, NAME_MESSAGE),
  // Only the house number and the street: the ward comes from its own select and the province
  // follows the ward, so neither is typed here.
  addressText: z
    .string()
    .trim()
    .min(1, "Nhập số nhà và tên đường.")
    .min(5, ADDRESS_MESSAGE)
    .max(200, ADDRESS_MESSAGE),
  wardCode: z.string().regex(/^\d{5}$/, WARD_MESSAGE),
  // The pin (spec 0011): two texts, both empty or both a number. The rules need the ward, so
  // they sit on the whole object (`createPropertySchema`), not on these two.
  latitude: z.string(),
  longitude: z.string(),
  fees: feesSchema,
  amenityKeys: amenityKeysSchema,
});

/** A ward as the pin check needs it. A `CatalogWard` fits. */
export type PropertyWard = Pick<
  CatalogWard,
  "code" | "name" | "provinceName" | "bounds"
>;

/**
 * The schema of the form, as a pure function of the ward list, because the box of a ward is
 * data (spec 0011, AC-7). A ward that is not in the list (the catalog is still loading, or the
 * ward is not chosen yet) counts as having no box, so only the two city boxes are checked.
 */
export const createPropertySchema = (wards: readonly PropertyWard[]) =>
  propertyShape.superRefine(({ latitude, longitude, wardCode }, ctx) => {
    const ward = wards.find((entry) => entry.code === wardCode) ?? null;
    for (const { field, message } of pinFieldIssues(
      latitude,
      longitude,
      ward,
    )) {
      ctx.addIssue({ code: "custom", message, path: [field] });
    }
  });

// What the form holds while the person types, and what the submit handler gets after the
// schema has trimmed the texts and turned each price into a number.
export type PropertyInput = z.input<typeof propertyShape>;
export type PropertyValues = z.output<typeof propertyShape>;

export const EMPTY_PROPERTY: PropertyInput = {
  name: "",
  addressText: "",
  wardCode: "",
  latitude: "",
  longitude: "",
  fees: [],
  amenityKeys: [],
};

/**
 * The request body: the trimmed texts, the ward `code`, and both lists. `fees` and `amenityKeys`
 * are always there, empty or not, so the one builder also serves the edit form of #12, where an
 * empty list means "remove them all". The pin is there only when both fields hold a number, as
 * numbers rounded to 6 decimals, and is left out otherwise, so one coordinate is never sent alone.
 */
export const toPropertyBody = ({
  name,
  addressText,
  wardCode,
  latitude,
  longitude,
  fees,
  amenityKeys,
}: PropertyValues): PropertyBody => {
  const pin = pinFromFields(latitude, longitude);
  return {
    name,
    addressText,
    wardCode,
    ...(pin ? roundPin(pin) : {}),
    fees: toFeesBody(fees),
    amenityKeys,
  };
};
