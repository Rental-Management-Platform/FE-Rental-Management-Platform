"use client";

import { useRouter } from "next/navigation";
import { LandlordPicker } from "@/features/admin-orders/components/landlord-picker";
import { useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { ALL_LANDLORDS, LANDLORD_FILTER_LABEL } from "../admin-reviews-text";
import { adminReviewsHref, type LandlordFilters } from "../review-filter";

/**
 * The landlord filter of the landlord tab (scope #36): the shared landlord picker, a field with a
 * search row, that writes the choice to the address and goes back to page 1. It needs the
 * permission `user:read`, and a person without it simply has no field, so it draws nothing. A list
 * that fails to load never blocks the reviews: only this field says so.
 */
export function LandlordSelect({ filters }: { filters: LandlordFilters }) {
  const session = useSession();
  const router = useRouter();

  if (!can(session, "user:read")) return null;

  return (
    <LandlordPicker
      label={LANDLORD_FILTER_LABEL}
      allLabel={ALL_LANDLORDS}
      value={filters.landlordId}
      onChange={(next) =>
        router.push(adminReviewsHref({ ...filters, landlordId: next }, 1), {
          scroll: false,
        })
      }
    />
  );
}
