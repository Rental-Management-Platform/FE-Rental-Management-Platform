"use client";

import { MapPinIcon } from "lucide-react";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { READ_ONLY_MAP_HEIGHT_CLASS } from "../config";
import { useMapModule } from "../hooks/use-map-module";
import { MapSkeleton } from "./map-skeleton";

/**
 * The saved pin of a property, on a small map nobody can change (spec 0011, AC-13). It shows
 * nothing for a property with no point. A button opens the map, loaded on demand like the picker.
 * The point is shown as stored: no area check, no ward box, no lookup, and a point saved before
 * the backend checked it is not corrected here. Zoom is by the + and - buttons or the keyboard;
 * the wheel scrolls the page.
 */
export function ReadOnlyLocation({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const { state, load } = useMapModule();

  if (latitude === null || longitude === null) return null;

  const toggle = () => {
    if (!open) load();
    setOpen(!open);
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        <MapPinIcon aria-hidden="true" />
        {open ? "Thu gọn bản đồ" : "Xem vị trí trên bản đồ"}
      </Button>
      <div id={panelId} hidden={!open} className="w-full">
        {open &&
          (state.status === "failed" ? (
            <Alert variant="warning">
              <AlertTitle>Không tải được bản đồ</AlertTitle>
              <AlertDescription>
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
          ) : state.status === "ready" ? (
            <state.LocationMap
              readOnly
              pin={{ latitude, longitude }}
              wardBounds={null}
              view={null}
              label="Vị trí nhà trọ trên bản đồ"
              heightClassName={READ_ONLY_MAP_HEIGHT_CLASS}
            />
          ) : (
            <MapSkeleton heightClassName={READ_ONLY_MAP_HEIGHT_CLASS} />
          ))}
      </div>
    </div>
  );
}
