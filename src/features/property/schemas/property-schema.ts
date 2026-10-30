import { z } from "zod";
import type { PropertyBody } from "@/lib/api/types";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.17). The limits
// are the ones of `POST /properties`; fees, amenities and coordinates join with #11.

const NAME_MESSAGE = "Tên nhà trọ cần từ 2 đến 100 ký tự.";
const ADDRESS_MESSAGE = "Số nhà và tên đường cần từ 5 đến 200 ký tự.";

// The form holds an empty string until a ward is chosen, and a ward `code` is five digits.
const WARD_MESSAGE = "Chọn phường hoặc xã.";

export const propertySchema = z.object({
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
});

// What the form holds while the person types, and what the submit handler gets after the
// schema has trimmed the two texts.
export type PropertyInput = z.input<typeof propertySchema>;
export type PropertyValues = z.output<typeof propertySchema>;

export const EMPTY_PROPERTY: PropertyInput = {
  name: "",
  addressText: "",
  wardCode: "",
};

/** The request body: the trimmed texts and the ward `code`, nothing else. */
export const toPropertyBody = ({
  name,
  addressText,
  wardCode,
}: PropertyValues): PropertyBody => ({ name, addressText, wardCode });
