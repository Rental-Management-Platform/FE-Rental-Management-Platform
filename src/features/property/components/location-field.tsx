"use client";

import { MapPinIcon, SearchIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
  useWatch,
  type Control,
  type ControllerRenderProps,
} from "react-hook-form";
import { FormField, type FormFieldAria } from "@/components/form/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { checkPin } from "@/features/location-map/area";
import { MapSkeleton } from "@/features/location-map/components/map-skeleton";
import type { LocationPin } from "@/features/location-map/hooks/use-location-pin";
import { useMapModule } from "@/features/location-map/hooks/use-map-module";
import { savedPinOutOfPlaceNote } from "@/features/location-map/texts";
import type {
  PropertyInput,
  PropertyValues,
  PropertyWard,
} from "../schemas/property-schema";

type PropertyControl = Control<PropertyInput, unknown, PropertyValues>;

/**
 * The location zone of a property form: a "Vị trí trên bản đồ" card, closed by default behind one
 * button (spec 0011, AC-1). The map module is imported when the button is pressed (AC-2). Under
 * the map are two number fields, "Vĩ độ" and "Kinh độ", which always work, even when the map or
 * its tiles do not (AC-6, AC-14).
 *
 * The values live in the parent form (`control`), and the pin state and the lookups in
 * `location`. `open` is the parent's, so a backend error on a coordinate can open the zone before
 * focus goes to its field.
 */
export function LocationField({
  control,
  location,
  ward,
  open,
  onOpenChange,
  boundsPending,
}: {
  control: PropertyControl;
  location: LocationPin;
  /** The chosen ward, or `null`. The map cannot open without one (AC-1). */
  ward: PropertyWard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The ward boxes are still on their way, so the map cannot choose its first view yet. */
  boundsPending: boolean;
}) {
  const titleId = useId();
  const panelId = useId();
  const hintId = useId();
  const searchHintId = useId();
  const mapModule = useMapModule();
  const [tilesFailed, setTilesFailed] = useState(false);
  const { state, load } = mapModule;

  const toggle = () => {
    if (open) {
      onOpenChange(false);
      setTilesFailed(false);
      location.abortLookups();
      return;
    }
    onOpenChange(true);
    load();
  };

  // A backend error on a coordinate opens the zone without the button. The map is wanted then
  // too, so its module is imported here (the button's own click does it in the usual case).
  const wantsMap = open && state.status === "idle";
  useEffect(() => {
    if (wantsMap) load();
  }, [wantsMap, load]);

  // "Xóa ghim" is there whenever there is something to clear: a pin, or any text in a box. The
  // search button needs an address to search for, and the ward boxes, so its search is limited
  // to the ward.
  const [latitude, longitude, addressText] = useWatch({
    control,
    name: ["latitude", "longitude", "addressText"],
  });
  const canClear = location.pin !== null || latitude !== "" || longitude !== "";
  const canSearch =
    addressText.trim() !== "" && !location.busy && !boundsPending;

  // A starting point that is outside the allowed area of the ward (a property saved before the
  // backend checked it, AC-12). The create form never starts with a pin, the edit form of #12
  // does. It is warned about, never changed.
  const outOfPlace =
    ward !== null &&
    location.pin !== null &&
    location.source === null &&
    checkPin(location.pin, ward.bounds) !== "ok";

  return (
    <Card role="group" aria-labelledby={titleId}>
      <CardHeader className="border-b">
        <CardTitle id={titleId}>Vị trí trên bản đồ</CardTitle>
        <CardDescription>
          Không bắt buộc. Ghim vị trí nhà trọ trên bản đồ, hoặc bỏ qua bước này.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-5">
        <div className="flex flex-col items-start gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!ward}
            aria-expanded={open}
            aria-controls={panelId}
            aria-describedby={!ward ? hintId : undefined}
            onClick={toggle}
          >
            <MapPinIcon aria-hidden="true" />
            {open ? "Thu gọn bản đồ" : "Chọn vị trí trên bản đồ"}
          </Button>
          {!ward && (
            <p id={hintId} className="text-sm text-muted-foreground">
              Chọn phường, xã hoặc đặc khu trước để mở bản đồ.
            </p>
          )}
        </div>

        {/* Both regions are always in the page, so a screen reader hears each change of their
            text. The first is for screen readers only; the second is the visible line under the
            zone title, and it shows a note (a dropped pin) even while the map is closed. */}
        <p role="status" aria-live="polite" className="sr-only">
          {location.announcement}
        </p>
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground empty:hidden"
        >
          {location.message && (
            <>
              <span>{location.message.text}</span>
              {location.message.retry && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={location.message.retry}
                >
                  Thử lại
                </Button>
              )}
            </>
          )}
        </div>

        <div id={panelId} hidden={!open} className="flex flex-col gap-4">
          {open && (
            <>
              {state.status === "failed" ? (
                <Alert variant="warning">
                  <AlertTitle>Không tải được bản đồ</AlertTitle>
                  <AlertDescription>
                    <p>Bạn vẫn có thể nhập vĩ độ và kinh độ.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={load}
                    >
                      Thử lại
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : state.status === "ready" && !boundsPending ? (
                <state.LocationMap
                  pin={location.pin}
                  warning={outOfPlace}
                  wardBounds={ward?.bounds ?? null}
                  view={location.view}
                  label="Bản đồ chọn vị trí nhà trọ"
                  onPick={location.place}
                  onTilesFailed={() => setTilesFailed(true)}
                />
              ) : (
                <MapSkeleton />
              )}

              {tilesFailed && (
                <Alert variant="warning">
                  <AlertTitle>Không tải được hình bản đồ</AlertTitle>
                  <AlertDescription>
                    Bạn vẫn có thể nhập vĩ độ và kinh độ.
                  </AlertDescription>
                </Alert>
              )}

              {outOfPlace && ward && (
                <Alert variant="warning">
                  <AlertTitle>{savedPinOutOfPlaceNote(ward.name)}</AlertTitle>
                </Alert>
              )}

              <p className="hidden text-sm text-muted-foreground pointer-coarse:block">
                Dùng hai ngón tay để di chuyển bản đồ.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="latitude"
                  label="Vĩ độ"
                  description="Ví dụ 10.7721. Có thể dùng dấu chấm hoặc dấu phẩy."
                >
                  {({ field, aria }) => (
                    <PinNumberInput
                      field={field}
                      aria={aria}
                      onApply={location.applyFields}
                    />
                  )}
                </FormField>
                <FormField
                  control={control}
                  name="longitude"
                  label="Kinh độ"
                  description="Ví dụ 106.6983. Có thể dùng dấu chấm hoặc dấu phẩy."
                >
                  {({ field, aria }) => (
                    <PinNumberInput
                      field={field}
                      aria={aria}
                      onApply={location.applyFields}
                    />
                  )}
                </FormField>
              </div>

              <div className="flex flex-col items-start gap-3">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={!canSearch}
                    aria-describedby={searchHintId}
                    onClick={location.searchAddress}
                  >
                    <SearchIcon aria-hidden="true" />
                    Tìm vị trí trên bản đồ
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={!canClear}
                    onClick={location.clear}
                  >
                    Xóa ghim
                  </Button>
                </div>
                <p id={searchHintId} className="text-sm text-muted-foreground">
                  Đã gõ số nhà và tên đường ở trên? Bấm &ldquo;Tìm vị trí trên
                  bản đồ&rdquo; để ghim theo địa chỉ đó. Bấm hoặc kéo ghim thì
                  địa chỉ đổi theo nơi bạn chọn.
                </p>
                <p className="text-sm text-muted-foreground">
                  Bản đồ và tìm địa chỉ do OpenStreetMap cung cấp. Địa chỉ bạn
                  nhập và điểm bạn ghim được gửi tới OpenStreetMap khi bạn tìm.
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// One of the two number boxes. Leaving it, or Enter in it, applies the pair to the pin; Enter
// never sends the form, because the submit button does that (AC-6).
function PinNumberInput({
  field,
  aria,
  onApply,
}: {
  field: ControllerRenderProps<PropertyInput, "latitude" | "longitude">;
  aria: FormFieldAria;
  onApply: () => void;
}) {
  return (
    <Input
      size="lg"
      inputMode="decimal"
      autoComplete="off"
      {...field}
      {...aria}
      onBlur={() => {
        field.onBlur();
        onApply();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        onApply();
      }}
    />
  );
}
