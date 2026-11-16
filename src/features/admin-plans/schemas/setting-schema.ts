import { z } from "zod";
import { formatCount } from "@/lib/format";

// One trial setting is one whole number between the `min` and `max` the API sent with it
// (api-for-frontend.md, 6.24), so the form holds no limit of its own: the schema is made from the
// two numbers of the setting it belongs to. The form holds text, and the schema turns it into the
// integer `PATCH /settings/:key` wants (a string or a decimal is a 400).

const WHOLE = /^\d+$/;

export const settingSchema = (min: number, max: number) =>
  z.object({
    value: z
      .string()
      .trim()
      .min(1, "Nhập một số.")
      .regex(WHOLE, "Chỉ nhập chữ số, không dùng dấu chấm hay dấu phẩy.")
      .transform(Number)
      .refine(
        (n) => n >= min && n <= max,
        `Nhập số từ ${formatCount(min)} đến ${formatCount(max)}.`,
      ),
  });

export type SettingInput = z.input<ReturnType<typeof settingSchema>>;
export type SettingValues = z.output<ReturnType<typeof settingSchema>>;
