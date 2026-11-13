import { z } from "zod";
import { emailField } from "./fields";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.7).
export const forgotPasswordSchema = z.object({ email: emailField });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
