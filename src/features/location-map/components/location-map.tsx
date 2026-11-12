"use client";

import "leaflet/dist/leaflet.css";
import "./location-map.css";
import {
  divIcon,
  type LatLngBoundsExpression,
  type LeafletMouseEvent,
  type Marker as LeafletMarker,
  type Map as LeafletMap,
} from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AttributionControl,
  MapContainer,
  Marker,
  Rectangle,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { FOCUS_RING } from "@/lib/focus-ring";
import type { WardBounds } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  ATTRIBUTION_HTML,
  CITY_VIEW,
  MAP_HEIGHT_CLASS,
  PIN_ZOOM,
  TILE_MAX_ZOOM,
  TILE_URL,
} from "../config";
import type { Pin, ViewRequest } from "../pin";

// The Leaflet piece of the location map (spec 0011). It is the default export of a module that
// the zone loads with `import()` when the person opens the map, so Leaflet, its stylesheet and
// every tile stay unrequested until then (AC-2). It holds no form value: the pin comes in as a
// prop and every change goes out through `onPick`.

export interface LocationMapProps {
  /** The one marker, or `null` for none. */
  pin: Pin | null;
  /** Draws the marker in the warning style: a saved point that is out of place (AC-12). */
  warning?: boolean;
  /** The ward box drawn as an outline, and the first view when there is no pin. */
  wardBounds: WardBounds | null;
  /** A move the map did not make itself. The one present at mount is not applied again. */
  view: ViewRequest | null;
  /** No pin can be placed or dragged, no ward box (the saved pin of the listing forms, AC-13). */
  readOnly?: boolean;
  /** The name of the map for a screen reader. */
  label: string;
  heightClassName?: string;
  /**
   * A click, a tap or the end of a drag. Returns whether the pin was accepted; a refused drag
   * puts the marker back where it was (AC-4).
   */
  onPick?: (pin: Pin, source: "click" | "drag") => boolean;
  /** The first tiles did not come (AC-14). */
  onTilesFailed?: () => void;
}

const MARKER_TITLE = "Ghim vị trí nhà trọ";

// An inline SVG, so no image file and no default icon path problem of the bundlers (AC-3). The
// pin is `primary` with a `card` outline, or `warning-foreground` for a point out of place.
const pinIcon = (warning: boolean) =>
  divIcon({
    className: "",
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    html: `<svg viewBox="0 0 32 40" width="32" height="40" role="img" aria-label="${MARKER_TITLE}"><path d="M16 1.5C8.5 1.5 2.5 7.4 2.5 14.8 2.5 24.6 16 38.5 16 38.5S29.5 24.6 29.5 14.8C29.5 7.4 23.5 1.5 16 1.5Z" stroke-width="2" class="${warning ? "fill-warning-foreground" : "fill-primary"} stroke-card"/><circle cx="16" cy="14.8" r="5" class="fill-card"/></svg>`,
  });

const toLatLngBounds = (box: WardBounds): LatLngBoundsExpression => [
  [box.minLatitude, box.minLongitude],
  [box.maxLatitude, box.maxLongitude],
];

const matches = (query: string) => window.matchMedia(query).matches;

export default function LocationMap({
  pin,
  warning = false,
  wardBounds,
  view,
  readOnly = false,
  label,
  heightClassName = MAP_HEIGHT_CLASS,
  onPick,
  onTilesFailed,
}: LocationMapProps) {
  // Read once, when the map opens. This module only runs in the browser, after a click.
  const [coarse] = useState(() => matches("(pointer: coarse)"));
  const [reduceMotion] = useState(() =>
    matches("(prefers-reduced-motion: reduce)"),
  );
  const icon = useMemo(() => pinIcon(warning), [warning]);
  const tileHandlers = useTileFailure(onTilesFailed);

  // The opening view (AC-5). Leaflet reads these once, so a later change moves nothing: later
  // moves come through `view`.
  const start = pin
    ? {
        center: [pin.latitude, pin.longitude] as [number, number],
        zoom: PIN_ZOOM,
      }
    : wardBounds && !readOnly
      ? { bounds: toLatLngBounds(wardBounds) }
      : {
          center: [CITY_VIEW.latitude, CITY_VIEW.longitude] as [number, number],
          zoom: CITY_VIEW.zoom,
        };

  return (
    <div
      className={cn(
        // `isolate` keeps the high z-index of Leaflet's panes inside the map, under the header.
        "location-map isolate w-full overflow-hidden rounded-lg border",
        heightClassName,
      )}
    >
      <MapContainer
        {...start}
        className={cn("size-full", FOCUS_RING)}
        attributionControl={false}
        // The wheel scrolls the page and a double click never places a surprise pin (AC-3, AC-15).
        scrollWheelZoom={false}
        doubleClickZoom={false}
        // One finger scrolls the page and two fingers move and zoom the map. The marker still
        // drags with one finger, and a tap still places the pin (AC-15).
        dragging={!coarse}
        touchZoom
        zoomAnimation={!reduceMotion}
        fadeAnimation={!reduceMotion}
        markerZoomAnimation={!reduceMotion}
      >
        <TileLayer
          url={TILE_URL}
          maxZoom={TILE_MAX_ZOOM}
          attribution={ATTRIBUTION_HTML}
          eventHandlers={tileHandlers}
        />
        <AttributionControl prefix={false} position="bottomright" />
        <MapSetup label={label} />
        <ViewController view={view} reduceMotion={reduceMotion} />
        {!readOnly && wardBounds && (
          <Rectangle
            bounds={toLatLngBounds(wardBounds)}
            interactive={false}
            pathOptions={{
              weight: 2,
              dashArray: "6 4",
              className: "stroke-primary fill-primary/10",
            }}
          />
        )}
        {!readOnly && onPick && <ClickToPick onPick={onPick} />}
        {pin && (
          <Marker
            position={[pin.latitude, pin.longitude]}
            icon={icon}
            title={MARKER_TITLE}
            draggable={!readOnly}
            keyboard={!readOnly}
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as LeafletMarker;
                const { lat, lng } = marker.getLatLng();
                const accepted = onPick?.(
                  { latitude: lat, longitude: lng },
                  "drag",
                );
                // A drag that ends where no pin may be goes back to where it was.
                if (accepted === false) {
                  marker.setLatLng([pin.latitude, pin.longitude]);
                }
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

// The tiles failed when none has loaded before the third error (AC-14). A tile that loads later
// does not undo the message: the zone shows it until the person closes the map.
function useTileFailure(onTilesFailed: (() => void) | undefined) {
  const loaded = useRef(false);
  const errors = useRef(0);
  return {
    tileload: () => {
      loaded.current = true;
    },
    tileerror: () => {
      errors.current += 1;
      if (!loaded.current && errors.current === 3) onTilesFailed?.();
    },
  };
}

function ClickToPick({
  onPick,
}: {
  onPick: (pin: Pin, source: "click") => boolean;
}) {
  useMapEvents({
    click: (event: LeafletMouseEvent) => {
      onPick(
        { latitude: event.latlng.lat, longitude: event.latlng.lng },
        "click",
      );
    },
  });
  return null;
}

// The things that need the map object and render nothing: the name of the map for a screen
// reader, and the overlay pane (the ward outline) hidden from it because it only decorates.
function MapSetup({ label }: { label: string }) {
  const map = useMap();
  useEffect(() => {
    map.getContainer().setAttribute("aria-label", label);
    map.getPane("overlayPane")?.setAttribute("aria-hidden", "true");
  }, [map, label]);
  return null;
}

// Applies the moves that come from outside (a lookup result, the number fields, a ward change).
// With reduced motion every move is a plain `setView` with no animation (AC-15).
function ViewController({
  view,
  reduceMotion,
}: {
  view: ViewRequest | null;
  reduceMotion: boolean;
}) {
  const map = useMap();
  const applied = useRef(view);
  useEffect(() => {
    if (!view || view === applied.current) return;
    applied.current = view;
    move(map, view, reduceMotion);
  }, [map, view, reduceMotion]);
  return null;
}

function move(map: LeafletMap, view: ViewRequest, reduceMotion: boolean) {
  if (view.kind === "pin") {
    const at: [number, number] = [view.pin.latitude, view.pin.longitude];
    if (reduceMotion) map.setView(at, view.zoom, { animate: false });
    else map.flyTo(at, view.zoom);
    return;
  }
  if (view.bounds) {
    map.fitBounds(toLatLngBounds(view.bounds), { animate: !reduceMotion });
    return;
  }
  map.setView([CITY_VIEW.latitude, CITY_VIEW.longitude], CITY_VIEW.zoom, {
    animate: !reduceMotion,
  });
}
