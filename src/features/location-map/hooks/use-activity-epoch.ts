"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Tells a component that holds a Leaflet map when it is hidden and shown again.
 *
 * With Cache Components Next.js keeps the page you left in the DOM, inside `<Activity>`, so that
 * "back" can show it at once. A hidden `<Activity>` runs the cleanup of every effect and keeps the
 * state, and showing it runs the setup again. `MapContainer` of react-leaflet creates its map once,
 * in a ref callback, and only its cleanup calls `map.remove()`. After a hide and a show the map is
 * dead but still in its state: the layers add themselves to it and throw "Cannot read properties of
 * undefined (reading 'appendChild')", and the cleanup that follows throws "Map container is being
 * reused by another instance". Both reach the route's error boundary.
 *
 * The map is therefore rendered only while this returns a number, with the number as its `key`. A
 * hide sets it to `null`, which unmounts the map, and a show gives a new number, which mounts a
 * fresh one. The number never repeats, so even a hide and a show that are batched together replace
 * the map.
 */
export function useActivityEpoch(): number | null {
  const [epoch, setEpoch] = useState<number | null>(null);
  const shown = useRef(0);

  // A layout effect, so the map is in the first paint and not one frame later.
  useLayoutEffect(() => {
    shown.current += 1;
    setEpoch(shown.current);
    return () => setEpoch(null);
  }, []);

  return epoch;
}
