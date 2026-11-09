import { z } from "zod";

/** The longest message the backend takes, in characters (api-for-frontend.md, 6.39). */
export const MESSAGE_MAX = 1000;

/**
 * How long a draft is, as the backend counts it: Unicode characters of the text with its ends
 * trimmed. `Array.from` walks code points, so one emoji is one character. (A joined emoji, such
 * as a family, is several code points and may count higher here than at the backend, which has
 * the last word.)
 */
export const messageLength = (draft: string): number =>
  Array.from(draft.trim()).length;

export const messageSchema = z.object({
  body: z
    .string()
    .refine((draft) => messageLength(draft) >= 1, {
      message: "Hãy nhập nội dung tin nhắn.",
    })
    .refine((draft) => messageLength(draft) <= MESSAGE_MAX, {
      message: `Tin nhắn dài tối đa ${MESSAGE_MAX} ký tự.`,
    }),
});

export type MessageValues = z.infer<typeof messageSchema>;

/** What the textarea starts with, and what a sent message resets it to. */
export const EMPTY_MESSAGE: MessageValues = { body: "" };
