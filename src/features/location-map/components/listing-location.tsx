"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LISTING_MAP_HEIGHT_CLASS } from "../config";
import { useInView } from "../hooks/use-in-view";
import { useMapModule } from "../hooks/use-map-module";
import type { Pin } from "../pin";
import { MapSkeleton } from "./map-skeleton";

/**
 * The saved point of a property on the public listing page (spec 0018). It is a box of fixed
 * height from the first paint, so the page does not jump, and the map module (Leaflet, its
 * stylesheet and every tile) is imported only when the box comes near the screen. The map is
 * the read only one of the listing forms: no pin can be moved, the wheel scrolls the page, and
 * zoom is by the + and − buttons or the keyboard.
 *
 * The caller decides whether there is a point worth showing (`publicPin`), so this draws a map
 * for the pin it gets and nothing else.
 */
export function ListingLocation({ pin }: { pin: Pin }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  const { state, load } = useMapModule();
  const [tilesFailed, setTilesFailed] = useState(false);

  const wantsMap = seen && state.status === "idle";
  useEffect(() => {
    if (wantsMap) load();
  }, [wantsMap, load]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={ref}
        className={cn("relative w-full", LISTING_MAP_HEIGHT_CLASS)}
      >
        {state.status === "ready" ? (
          <state.LocationMap
            readOnly
            pin={pin}
            wardBounds={null}
            view={null}
            label="Vị trí nhà trọ trên bản đồ"
            heightClassName="h-full"
            onTilesFailed={() => setTilesFailed(true)}
          />
        ) : state.status === "failed" ? (
          <Alert variant="warning">
            <AlertTitle>Không tải được bản đồ</AlertTitle>
            <AlertDescription>
              <p>Địa chỉ ở trên vẫn đúng.</p>
              <Button type="button" variant="outline" size="sm" onClick={load}>
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        ) : seen ? (
          <MapSkeleton heightClassName="h-full" />
        ) : (
          <Skeleton aria-hidden="true" className="size-full rounded-lg" />
        )}
        {/* Only drawn when scripts are off, where the map can never load. */}
        <noscript>
          <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
            Cần bật JavaScript để xem bản đồ.
          </p>
        </noscript>
      </div>
      {tilesFailed && (
        <p className="text-sm text-muted-foreground">
          Không tải được hình bản đồ. Địa chỉ ở trên vẫn đúng.
        </p>
      )}
    </div>
  );
}
