import { z } from "zod";
import { passwordField } from "./fields";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.8). There is no
// "type it again" field: the password box has a show and hide button instead (spec 0005).
export const resetPasswordSchema = z.object({ newPassword: passwordField });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
