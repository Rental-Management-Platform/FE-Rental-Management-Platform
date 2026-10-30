import { z } from "zod";
import type { ListingBody } from "@/lib/api/types";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.18). The limits
// are the ones of `POST /properties/:propertyId/listings`. The form holds text, so the schema
// turns it into the numbers wanted by the API (and `null` for a blank optional field); that is
// why `useForm` gets the output type as its third generic.

const WHOLE = /^\d+$/;
// One optional decimal digit, comma or dot: "22", "22,5" and "22.5" pass, "22,55" does not.
const AREA = /^\d+([.,]\d)?$/;

const TITLE_MESSAGE = "Tiêu đề cần từ 5 đến 120 ký tự.";
const DESCRIPTION_MESSAGE = "Mô tả cần từ 10 đến 5.000 ký tự.";
const WHOLE_MESSAGE = "Chỉ nhập chữ số, không dùng dấu chấm hay dấu phẩy.";
const PRICE_MESSAGE = "Giá thuê từ 100.000 đến 100.000.000 đồng.";
const AREA_FORMAT_MESSAGE =
  "Chỉ nhập số, tối đa một chữ số sau dấu phẩy, ví dụ 22,5.";
const AREA_RANGE_MESSAGE = "Diện tích từ 1 đến 1.000 m².";
const DEPOSIT_MESSAGE = "Tiền cọc từ 0 đến 1.000.000.000 đồng.";
const DATE_MESSAGE = "Chọn một ngày hợp lệ.";

export const listingSchema = z.object({
  // The form holds an empty string until a property is chosen. It goes in the path of the
  // call and never in the body.
  propertyId: z.string().min(1, "Chọn nhà trọ."),
  title: z
    .string()
    .trim()
    .min(1, "Nhập tiêu đề.")
    .min(5, TITLE_MESSAGE)
    .max(120, TITLE_MESSAGE),
  // Plain text: the backend stores it as typed and the page shows it as text, never as HTML.
  description: z
    .string()
    .trim()
    .min(1, "Nhập mô tả.")
    .min(10, DESCRIPTION_MESSAGE)
    .max(5000, DESCRIPTION_MESSAGE),
  price: z
    .string()
    .trim()
    .min(1, "Nhập giá thuê.")
    .regex(WHOLE, WHOLE_MESSAGE)
    .transform(Number)
    .refine((dong) => dong >= 100_000 && dong <= 100_000_000, PRICE_MESSAGE),
  areaM2: z
    .string()
    .trim()
    .min(1, "Nhập diện tích.")
    .regex(AREA, AREA_FORMAT_MESSAGE)
    .transform((text) => Number(text.replace(",", ".")))
    .refine((m2) => m2 >= 1 && m2 <= 1000, AREA_RANGE_MESSAGE),
  // Optional: a blank field is `null` here, and `toListingBody` leaves it out of a post.
  deposit: z
    .string()
    .trim()
    .refine((text) => text === "" || WHOLE.test(text), WHOLE_MESSAGE)
    .transform((text) => (text === "" ? null : Number(text)))
    .refine(
      (dong) => dong === null || (dong >= 0 && dong <= 1_000_000_000),
      DEPOSIT_MESSAGE,
    ),
  // `YYYY-MM-DD` from the date picker, or blank. The picker only builds real days; this catches
  // a value that came from somewhere else.
  availableFrom: z
    .string()
    .trim()
    .refine(
      (text) => text === "" || z.iso.date().safeParse(text).success,
      DATE_MESSAGE,
    )
    .transform((text) => (text === "" ? null : text)),
});

// What the form holds while the person types, and what the submit handler gets after the
// schema has trimmed the texts and turned the digits into numbers.
export type ListingInput = z.input<typeof listingSchema>;
export type ListingValues = z.output<typeof listingSchema>;

export const emptyListing = (propertyId: string): ListingInput => ({
  propertyId,
  title: "",
  description: "",
  price: "",
  areaM2: "",
  deposit: "",
  availableFrom: "",
});

/**
 * The request body of a post: the listing's own fields. `propertyId` is the path, not a field,
 * and a blank deposit or date is left out (a post has nothing to clear).
 */
export const toListingBody = ({
  title,
  description,
  price,
  areaM2,
  deposit,
  availableFrom,
}: ListingValues): ListingBody => ({
  title,
  description,
  price,
  areaM2,
  ...(deposit !== null && { deposit }),
  ...(availableFrom !== null && { availableFrom }),
});
