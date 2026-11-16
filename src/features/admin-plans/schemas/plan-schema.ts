import { z } from "zod";
import type { AdminPlan, PlanBody } from "@/lib/api/types";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.26). The limits are
// the ones of `POST /plans`. The form holds text, so the schema turns it into the numbers the API
// wants; that is why `useForm` gets the output type as its third generic.

const WHOLE = /^\d+$/;

const NAME_MESSAGE = "Tên gói cần từ 2 đến 60 ký tự.";
const WHOLE_MESSAGE = "Chỉ nhập chữ số, không dùng dấu chấm hay dấu phẩy.";
const PRICE_MESSAGE = "Giá từ 0 đến 100.000.000 đồng.";
const LIMIT_MESSAGE = "Số tin từ 1 đến 1.000.";
const DAYS_MESSAGE = "Số ngày từ 1 đến 365.";

// A whole number typed as text, inside a range.
const whole = (empty: string, rangeMessage: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, empty)
    .regex(WHOLE, WHOLE_MESSAGE)
    .transform(Number)
    .refine((n) => n >= min && n <= max, rangeMessage);

export const planSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nhập tên gói.")
    .min(2, NAME_MESSAGE)
    .max(60, NAME_MESSAGE),
  price: whole("Nhập giá một kỳ.", PRICE_MESSAGE, 0, 100_000_000),
  maxListings: whole("Nhập số tin hiện cùng lúc.", LIMIT_MESSAGE, 1, 1000),
  durationDays: whole("Nhập số ngày mỗi kỳ.", DAYS_MESSAGE, 1, 365),
});

// What the form holds while the person types, and what the submit handler gets after the schema
// has trimmed the name and turned the digits into numbers.
export type PlanInput = z.input<typeof planSchema>;
export type PlanValues = z.output<typeof planSchema>;

/** A new plan starts with the 30 days the API itself would use. */
export const emptyPlan: PlanInput = {
  name: "",
  price: "",
  maxListings: "",
  durationDays: "30",
};

/** The form's starting values for a plan the server sent, as the text a person would type. */
export const fromPlan = (plan: AdminPlan): PlanInput => ({
  name: plan.name,
  price: String(plan.price),
  maxListings: String(plan.maxListings),
  durationDays: String(plan.durationDays),
});

/**
 * The request body of a create. `isActive` is left out, so the plan is on sale, which is the API's
 * own default.
 */
export const toPlanBody = (values: PlanValues): PlanBody => ({ ...values });

/** What a save sends: any of the four fields, and only the ones that changed. */
export type PlanPatch = Partial<
  Pick<PlanBody, "name" | "price" | "maxListings" | "durationDays">
>;

/** The fields whose value differs from the last copy the server sent. Empty when nothing changed. */
export const toPlanPatch = (
  values: PlanValues,
  current: AdminPlan,
): PlanPatch => ({
  ...(values.name !== current.name && { name: values.name }),
  ...(values.price !== current.price && { price: values.price }),
  ...(values.maxListings !== current.maxListings && {
    maxListings: values.maxListings,
  }),
  ...(values.durationDays !== current.durationDays && {
    durationDays: values.durationDays,
  }),
});
