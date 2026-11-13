import { z } from "zod";
import { passwordField } from "@/features/auth/schemas/fields";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.9). The current
// password only has to be there, and the new one may equal it, as the backend allows.
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Nhập mật khẩu hiện tại."),
  newPassword: passwordField,
});

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
