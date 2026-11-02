"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/form/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { propertiesKey } from "@/features/property/api/properties-key";
import { isAbortError } from "@/lib/api/abort";
import { describeError, isApiError, type ApiError } from "@/lib/api/errors";
import type {
  OwnerListingDetail,
  PropertyListItem,
  Uuid,
} from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { useApi } from "@/lib/session/auth-provider";
import { createListing } from "../api/create-listing";
import { findPostedListing } from "../api/find-posted-listing";
import { useLeaveWarning } from "../hooks/use-leave-warning";
import { usePickedPhotos } from "../hooks/use-picked-photos";
import {
  emptyListing,
  listingSchema,
  toListingBody,
  toListingFormData,
  type ListingInput,
  type ListingValues,
} from "../schemas/listing-schema";
import {
  isUnknownOutcome,
  photoErrors,
  type PickedPhoto,
  type PostAttempt,
} from "../schemas/picked-photos";
import { ListingForm, LISTING_FIELDS } from "./listing-form";
import { PostPhotos } from "./post-photos";

// The form's own paths in screen order. A message the backend sends for a field this form
// lacks is shown as the form level message, and focus goes to the first field in this order.
const FIELDS: readonly Path<ListingInput>[] = ["propertyId", ...LISTING_FIELDS];

const PROPERTY_HINT = "Địa chỉ, phí và tiện ích lấy từ nhà trọ bạn chọn.";

const NO_PHOTO_MESSAGE = "Chọn ít nhất 1 ảnh.";
const BAD_PHOTO_MESSAGE =
  "Có ảnh chưa dùng được. Hãy bỏ ảnh đã đánh dấu rồi đăng lại.";
const SMALLER_PHOTO_HINT = "Hãy chọn ảnh nhỏ hơn.";
const UNSETTLED_LINE =
  "Chưa rõ tin đã được đăng chưa. Hãy thử lại sau ít phút.";

// The backend says the property is gone, or is not the landlord's: both are fixed by reading
// the list again, so the choice can be dropped when it is no longer there.
const PROPERTY_ERRORS: readonly string[] = [
  "PROPERTY_NOT_FOUND",
  "NOT_RESOURCE_OWNER",
];

interface PostListingFormProps {
  /** The properties to choose from. At least one: the empty list is a state of the page. */
  properties: readonly PropertyListItem[];
  /**
   * The property chosen when the form starts, or "". It goes into the starting values and is
   * never set after mount, so the form is not dirty before the person types.
   */
  initialPropertyId: Uuid;
  /** Focus goes to the title when the form starts, for "Đăng tin khác". */
  focusTitleOnMount: boolean;
  /** Reads the list again and answers with the fresh items (a failed read answers nothing). */
  onRefreshProperties: () => Promise<readonly PropertyListItem[] | undefined>;
  /**
   * The listing is posted. `previews` are the photos' object URLs, now owned by the caller (it
   * frees them); they are empty when the photos on screen are no longer the ones that were sent.
   */
  onPosted: (
    listing: OwnerListingDetail,
    previews: readonly PickedPhoto[],
  ) => void;
}

// The post form: the shared listing form with a property select on top and the photo zone
// after the price, and the one call that creates the listing with its photos (api-for-frontend.md,
// 6.18). When the answer of a post is lost, the next press first checks whether it was saved.
export function PostListingForm({
  properties,
  initialPropertyId,
  focusTitleOnMount,
  onRefreshProperties,
  onPosted,
}: PostListingFormProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const picked = usePickedPhotos();
  // What the backend said about each photo after a failed post, and the line under the zone.
  const [marks, setMarks] = useState<Readonly<Record<string, string>>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  // The post whose answer was lost, or null. A ref: it never changes what is drawn.
  const attempt = useRef<PostAttempt | null>(null);
  const create = useMutation({
    mutationFn: ({ propertyId, form }: { propertyId: Uuid; form: FormData }) =>
      createListing(api, propertyId, form),
  });
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ListingInput, unknown, ListingValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: emptyListing(initialPropertyId),
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );
  const propertyId = useWatch({ control, name: "propertyId" });
  const chosen = properties.find((property) => property.id === propertyId);

  // The result replaces this form after a post, which unmounts it and switches the warning off.
  // A photo chosen counts as typed text.
  useLeaveWarning(isDirty || picked.photos.length > 0);

  useEffect(() => {
    if (focusTitleOnMount) setFocus("title");
  }, [focusTitleOnMount, setFocus]);

  // A later read may no longer list the chosen property (it was deleted in another tab): the
  // choice goes, so the person picks from the list as it is now.
  useEffect(() => {
    if (propertyId !== "" && !chosen) setValue("propertyId", "");
  }, [propertyId, chosen, setValue]);

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
    setMarks({});
  };

  // The listing exists: tell the property list, say so, and hand the form over to the result.
  const finish = (listing: OwnerListingDetail, sentIds: readonly string[]) => {
    attempt.current = null;
    // The property's `listingCount` moved. Not returned, so the result does not wait for the read.
    void queryClient.invalidateQueries({ queryKey: propertiesKey });
    toast.success("Đã đăng tin", { description: listing.title });
    onPosted(listing, picked.handOver(sentIds));
  };

  // A failed post that is about the photos. Nothing was saved; the text and every photo stay.
  // The form level line is fixed copy, and the rows are shown on the tiles, not repeated in it.
  const showPhotoFailure = (error: ApiError, sent: readonly PickedPhoto[]) => {
    const { marks: found, zone } = photoErrors(error.errors, sent);
    setMarks(found);
    setPhotoError(zone);
    // Not `report`: it would join every unknown field into the form level message.
    clear();
    setError("root.server", {
      type: "server",
      message:
        error.code === "PAYLOAD_TOO_LARGE"
          ? `${error.message} ${SMALLER_PHOTO_HINT}`
          : BAD_PHOTO_MESSAGE,
    });
    const firstMarked = sent.find((photo) => found[photo.id] !== undefined);
    if (firstMarked !== undefined) {
      picked.requestFocus({
        kind: "tile",
        photoId: firstMarked.id,
        action: "remove",
      });
    } else if (zone !== null) {
      picked.requestFocus({ kind: "add" });
    }
  };

  // The earlier post may have been saved (AC-18): read before posting again. "post" means it
  // was not found and the post goes ahead; "stop" means the submit has ended here.
  const settleEarlier = async (
    earlier: PostAttempt,
  ): Promise<"post" | "stop"> => {
    try {
      const found = await findPostedListing(api, earlier);
      if (found === null) {
        attempt.current = null;
        return "post";
      }
      finish(found, earlier.sentPhotoIds);
      return "stop";
    } catch (error) {
      // The session changed under the request (a sign out in this tab): there is nothing to show.
      if (isAbortError(error)) return "stop";
      // Nothing is sent: it is still unknown whether the first post landed. The attempt stays.
      report(error);
      setError("root.server", {
        type: "server",
        message: `${describeError(error).message} ${UNSETTLED_LINE}`,
      });
      return "stop";
    }
  };

  const onSubmit = async (values: ListingValues) => {
    clearFailure();
    setPhotoError(null);
    const sent = picked.photos;
    if (sent.length === 0) {
      setPhotoError(NO_PHOTO_MESSAGE);
      picked.requestFocus({ kind: "add" });
      return;
    }
    const earlier = attempt.current;
    if (earlier !== null && (await settleEarlier(earlier)) === "stop") return;

    const sentIds = sent.map((photo) => photo.id);
    attempt.current = {
      startedAt: Date.now(),
      propertyId: values.propertyId,
      title: values.title,
      price: values.price,
      areaM2: values.areaM2,
      sentPhotoIds: sentIds,
    };
    try {
      const listing = await create.mutateAsync({
        propertyId: values.propertyId,
        form: toListingFormData(
          toListingBody(values),
          sent.map((photo) => photo.file),
        ),
      });
      finish(listing, sentIds);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): there is nothing to show.
      if (isAbortError(error)) return;
      // A definite answer means nothing was saved. A lost one leaves it open until the next press.
      if (!isUnknownOutcome(error)) attempt.current = null;
      if (
        isApiError(error) &&
        (error.code === "IMAGE_INVALID" || error.code === "PAYLOAD_TOO_LARGE")
      ) {
        showPhotoFailure(error, sent);
        return;
      }
      // Everything typed stays, also for the two quota errors: they are messages, never retried.
      report(error);
      if (isApiError(error) && PROPERTY_ERRORS.includes(error.code)) {
        void onRefreshProperties().then((fresh) => {
          if (
            fresh &&
            !fresh.some((property) => property.id === values.propertyId)
          ) {
            setValue("propertyId", "");
          }
        });
      }
    }
  };

  // Text fields that are wrong are shown by the form; a missing photo is shown under its zone.
  const onInvalid = () => {
    clearFailure();
    setPhotoError(picked.photos.length === 0 ? NO_PHOTO_MESSAGE : null);
  };

  return (
    <ListingForm
      label="Đăng tin mới"
      control={control}
      // Built inside the handler, so the submit code (which reads the clock and a ref) is never
      // reachable from rendering.
      onSubmit={(event) => void handleSubmit(onSubmit, onInvalid)(event)}
      property={
        <FormField
          control={control}
          name="propertyId"
          label="Nhà trọ"
          description={chosen?.fullAddress ?? PROPERTY_HINT}
        >
          {({ field, aria }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                ref={field.ref}
                size="lg"
                className="w-full"
                onBlur={field.onBlur}
                {...aria}
              >
                <SelectValue placeholder="Chọn nhà trọ" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      }
      photos={
        <PostPhotos
          photos={picked.photos}
          skipped={picked.skipped}
          announcement={picked.announcement}
          focusRequest={picked.focusRequest}
          marks={marks}
          error={photoError}
          // The order must match the order sent, because a backend row names a photo by place.
          disabled={isSubmitting}
          onAdd={(files) => {
            setPhotoError(null);
            picked.add(files);
          }}
          onMove={picked.move}
          onRemove={picked.remove}
        />
      }
      failure={failure}
      message={errors.root?.server?.message}
      secondsLeft={secondsLeft}
      isSubmitting={isSubmitting}
      submitLabel="Đăng tin"
      busyLabel="Đang đăng tin"
    />
  );
}
