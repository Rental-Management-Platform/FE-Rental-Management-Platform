import { compactPhone } from "@/features/auth/schemas/fields";
import type { Profile, UpdateProfileBody } from "@/lib/api/types";

// Pure: what the profile form holds, and what it sends.

type Editable = Pick<Profile, "name" | "phone">;

/** What the two boxes hold: `null` from the backend is an empty box. */
export interface ProfileValues {
  name: string;
  phone: string;
}

export const toProfileValues = ({ name, phone }: Editable): ProfileValues => ({
  name: name ?? "",
  phone: phone ?? "",
});

/**
 * The request body: only what changed, and `null` to remove a value (an empty string is a 400 for
 * the phone). The phone is compared the way the backend reads it, so `+84 912 345 678` for a
 * saved `0912345678` is not a change. What goes out is what the person typed. An empty result
 * means there is nothing to send.
 */
export function toProfilePatch(
  saved: Editable,
  values: ProfileValues,
): UpdateProfileBody {
  const body: UpdateProfileBody = {};

  const name = values.name.trim();
  if (name !== (saved.name ?? "")) body.name = name === "" ? null : name;

  const phone = values.phone.trim();
  if (compactPhone(phone) !== compactPhone(saved.phone ?? "")) {
    body.phone = phone === "" ? null : phone;
  }
  return body;
}
