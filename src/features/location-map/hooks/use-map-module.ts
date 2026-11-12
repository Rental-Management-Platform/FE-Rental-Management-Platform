"use client";

import { useState, type ComponentType } from "react";
import type { LocationMapProps } from "../components/location-map";

/**
 * Where the lazy map module is (spec 0011, AC-2). Leaflet, its stylesheet and the map component
 * all live in one module that is only imported when `load` runs, from the click that opens the
 * map. The state stays in the zone, so closing the map and opening it again finds `ready` and
 * does not download anything.
 */
export type MapModuleState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; LocationMap: ComponentType<LocationMapProps> }
  | { status: "failed" };

export function useMapModule() {
  const [state, setState] = useState<MapModuleState>({ status: "idle" });

  // Meant for a click handler. A call while loading or ready does nothing, so a double click
  // asks for the module once. "Thử lại" calls it again from `failed`.
  const load = () => {
    if (state.status === "loading" || state.status === "ready") return;
    setState({ status: "loading" });
    import("../components/location-map").then(
      (module) => setState({ status: "ready", LocationMap: module.default }),
      () => setState({ status: "failed" }),
    );
  };

  return { state, load };
}
