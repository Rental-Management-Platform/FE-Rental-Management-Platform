"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { removedAmenityKeys } from "@/features/amenities/amenity-keys";
import { useAmenities } from "@/features/amenities/hooks/use-amenities";
import {
  useLocationPin,
  type PinFields,
} from "@/features/location-map/hooks/use-location-pin";
import { useWardBounds } from "@/features/wards/hooks/use-ward-bounds";
import { useWards } from "@/features/wards/hooks/use-wards";
import { isApiError } from "@/lib/api/errors";
import type { CatalogWard, Ward } from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import {
  amenityRemovedMessage,
  PROPERTY_FORM_FIELDS,
  zoneFocusTarget,
} from "../form-failure";
import {
  createPropertySchema,
  type PinBaseline,
  type PropertyInput,
  type PropertyValues,
  type PropertyWard,
} from "../schemas/property-schema";

// Before the ward boxes arrive (or when they cannot), no ward has a box.
const NO_BOXED_WARDS: readonly CatalogWard[] = [];

// The ward the map works with: the entry with its box if the boxes are here, else the entry by
// name with no box, else none.
function chooseWard(
  code: string,
  boxed: readonly CatalogWard[],
  named: readonly Ward[] | undefined,
): PropertyWard | null {
  const withBox = boxed.find((ward) => ward.code === code);
  if (withBox) return withBox;
  const byName = named?.find((ward) => ward.code === code);
  return byName ? { ...byName, bounds: null } : null;
}

interface PropertyFormOptions {
  /** What the boxes start with: empty for a new property, the saved one when editing. */
  defaultValues: PropertyInput;
  /**
   * The edit form passes what the pin started from, so a saved pin that was not touched is not
   * checked against the ward (spec 0011, AC-12). The create form leaves it out.
   */
  saved?: PinBaseline | null;
  /** The location zone starts open, as it does for a property that already has a pin. */
  startsOpen?: boolean;
}

/**
 * Everything the five zones of a property form need, shared by the create form and the edit form
 * of #12 (specs 0017, 0011, 0015, 0019): the form itself, the ward and amenity catalogs, the pin
 * of the location zone, the way a failed save is put back on the form, and the countdown after a
 * 429. The two forms differ only in what they send and what they do with the answer, so each
 * calls `handleFailure` for the failures the two share and deals with its own first.
 */
export function usePropertyForm({
  defaultValues,
  saved = null,
  startsOpen = false,
}: PropertyFormOptions) {
  const wards = useWards();
  const amenities = useAmenities();
  const provinceId = useId();

  // The location zone is closed until the landlord opens it (or it starts open for a saved pin).
  // The ward boxes are read when it first opens and then stay in the cache, so the schema below
  // keeps them (spec 0011, AC-1).
  const [locationOpen, setLocationOpen] = useState(startsOpen);
  const wardBounds = useWardBounds({ enabled: locationOpen });
  const boxedWards = wardBounds.data ?? NO_BOXED_WARDS;
  const resolver = useMemo(
    () => zodResolver(createPropertySchema(boxedWards, saved)),
    [boxedWards, saved],
  );

  const form = useForm<PropertyInput, unknown, PropertyValues>({
    resolver,
    defaultValues,
  });
  const {
    control,
    setError,
    setValue,
    setFocus,
    getValues,
    clearErrors,
    trigger,
  } = form;
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    PROPERTY_FORM_FIELDS,
  );
  const wardCode = useWatch({ control, name: "wardCode" });

  // The province is not typed: it follows the ward that was chosen.
  const provinceName =
    wards.data?.find((ward) => ward.code === wardCode)?.provinceName ?? "";

  // The chosen ward as the map needs it: with its box when the boxes have arrived, else by name
  // alone and with no box, so only the two city boxes are checked (the backend checks the ward).
  const chosenWard = chooseWard(wardCode, boxedWards, wards.data);

  const pinFields: PinFields = {
    read: () => ({
      latitude: getValues("latitude"),
      longitude: getValues("longitude"),
    }),
    write: (latitude, longitude) => {
      setValue("latitude", latitude, { shouldDirty: true });
      setValue("longitude", longitude, { shouldDirty: true });
    },
    validate: () => trigger(["latitude", "longitude"]),
    clearErrors: () => clearErrors(["latitude", "longitude"]),
    readAddress: () => getValues("addressText"),
    writeAddress: (text) =>
      setValue("addressText", text, {
        shouldValidate: true,
        shouldDirty: true,
      }),
  };
  const location = useLocationPin({
    fields: pinFields,
    ward: chosenWard,
    open: locationOpen,
  });

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  // A ward was picked: a pin the new ward does not allow is dropped, and an open map fits the
  // new ward (spec 0011, AC-10).
  const onWardPicked = (code: string) =>
    location.onWardChange(chooseWard(code, boxedWards, wards.data));

  /**
   * The failures a property save has in common, whether it is a create or an edit. Call it with
   * the error that was thrown, the values that were sent, and the label of the submit button.
   *
   * - `AMENITY_UNKNOWN`: the catalog changed under the form and a ticked amenity is gone. Read it
   *   again, clear only the boxes that are gone, keep everything else, and say so in the
   *   amenities zone with focus on its first box (spec 0017, AC-10). The keys come from the form
   *   now and not from `values`, because the person may have ticked another box while the
   *   request ran. If the read fails, or nothing is gone after all, the backend's message shows.
   * - A message for a field goes under it, a message for no box goes in the form level notice, and
   *   a 429 starts the countdown (`useFormFailure`).
   * - A message for the fees zone or a coordinate moves focus into the zone, opening the location
   *   zone first (spec 0011, AC-11).
   * - `WARD_UNKNOWN`: read the ward catalog again and drop a choice that is gone.
   */
  const handleFailure = async (
    error: unknown,
    values: PropertyValues,
    submitLabel: string,
  ) => {
    if (isApiError(error) && error.code === "AMENITY_UNKNOWN") {
      const { data: catalog } = await amenities.refetch();
      const held = getValues("amenityKeys");
      const gone = catalog ? removedAmenityKeys(catalog, held) : [];
      if (gone.length > 0) {
        setValue(
          "amenityKeys",
          held.filter((key) => !gone.includes(key)),
          { shouldDirty: true },
        );
        setError(
          "amenityKeys",
          { type: "server", message: amenityRemovedMessage(submitLabel) },
          { shouldFocus: true },
        );
        return;
      }
    }

    report(error);
    const zoneTarget = zoneFocusTarget(error);
    if (zoneTarget === "latitude") {
      // The coordinate boxes only exist while the location zone is open: open it first, and
      // focus "Vĩ độ" once it has drawn (spec 0011, AC-11).
      setLocationOpen(true);
      requestAnimationFrame(() => setFocus("latitude"));
    } else if (zoneTarget) {
      setFocus(zoneTarget);
    }
    if (isApiError(error) && error.code === "WARD_UNKNOWN") {
      void wards.refetch().then(({ data }) => {
        if (!data?.some((ward) => ward.code === values.wardCode)) {
          setValue("wardCode", "");
        }
      });
    }
  };

  return {
    form,
    amenities,
    location,
    chosenWard,
    provinceId,
    provinceName,
    locationOpen,
    setLocationOpen,
    boundsPending: locationOpen && wardBounds.isPending,
    failure,
    secondsLeft,
    clearFailure,
    onWardPicked,
    handleFailure,
  };
}

export type PropertyFormState = ReturnType<typeof usePropertyForm>;
