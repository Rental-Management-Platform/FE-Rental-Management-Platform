"use client";

import { useState } from "react";
import { isAbortError } from "@/lib/api/abort";
import { checkPin } from "../area";
import { LOOKUP_ZOOM, PIN_ZOOM } from "../config";
import type { PinWard } from "../fields";
import {
  describePin,
  formatCoordinate,
  pinFromFields,
  roundPin,
  type Pin,
  type PinSource,
  type ViewRequest,
} from "../pin";
import { streetText } from "../street";
import {
  CITY_NAME,
  droppedPinNote,
  filledAddressText,
  NO_ROAD_TEXT,
  notFoundText,
  PIN_CLEARED_ANNOUNCEMENT,
  PIN_FROM_ADDRESS_ANNOUNCEMENT,
  refusalText,
  REVERSE_FAILED_TEXT,
  REVERSING_TEXT,
  SEARCH_FAILED_TEXT,
  SEARCHING_TEXT,
} from "../texts";
import { useAddressLookup } from "./use-address-lookup";

/**
 * How the pin and the street field reach the form. The form builds this from its own
 * `getValues`, `setValue`, `trigger` and `clearErrors`, so this feature never needs the form's
 * types.
 */
export interface PinFields {
  read(): { latitude: string; longitude: string };
  /** Sets both fields and marks them dirty. It does not validate. */
  write(latitude: string, longitude: string): void;
  /** Checks the two fields and shows their messages. Resolves to whether both are fine. */
  validate(): Promise<boolean>;
  clearErrors(): void;
  readAddress(): string;
  /** Sets "Số nhà và tên đường", marks it dirty and checks it. A write from code fires no blur. */
  writeAddress(text: string): void;
}

/** The chosen ward as the lookups need it. A `CatalogWard` fits. */
export interface LookupWard extends PinWard {
  provinceName: string;
}

/** The one line under the map. `busy` marks a lookup in flight, `retry` adds a "Thử lại". */
export interface LocationMessage {
  text: string;
  busy?: boolean;
  retry?: () => void;
}

/**
 * The state of the pin of one location zone (spec 0011): the marker, how it got there, the line
 * under the map, the announcement for a screen reader and the moves the open map should make,
 * plus the two address lookups. The two form fields hold the value; this holds what the fields
 * cannot say. The pin is written to the fields in one place, `place`, and only after the area
 * check passed. The pin and the address follow each other only by what the person does: a click
 * or a drag writes the street into the address field, and a typed address reaches the map only
 * through the button (`searchAddress`).
 */
export function useLocationPin({
  fields,
  ward,
  open,
}: {
  fields: PinFields;
  /** The chosen ward, or `null` while none is chosen. Its box is `null` when it has none. */
  ward: LookupWard | null;
  /** Whether the map is open: lookups run only then (AC-8). */
  open: boolean;
}) {
  // The marker starts from the fields, so a form that starts with a saved point shows it (AC-12).
  const [pin, setPin] = useState<Pin | null>(() => {
    const { latitude, longitude } = fields.read();
    return pinFromFields(latitude, longitude);
  });
  const [source, setSource] = useState<PinSource | null>(null);
  const [message, setMessage] = useState<LocationMessage | null>(null);
  // For a screen reader only.
  const [announcement, setAnnouncement] = useState("");
  const [view, setView] = useState<ViewRequest | null>(null);
  const lookups = useAddressLookup();

  /** Stops what is running. A "busy" line goes with it; any other line stays. */
  const abortLookups = () => {
    lookups.abort();
    setMessage((line) => (line?.busy ? null : line));
  };

  /**
   * Puts the pin at `candidate` if the area allows it, and says whether it did. A refusal leaves
   * the pin, the fields and the map as they were (AC-4). A click or a drag then asks for the
   * street of the point (AC-9).
   */
  const place = (candidate: Pin, how: PinSource): boolean => {
    const next = roundPin(candidate);
    if (checkPin(next, ward?.bounds ?? null) !== "ok") {
      setMessage({ text: refusalText(ward?.bounds ? ward.name : null) });
      return false;
    }
    fields.write(
      formatCoordinate(next.latitude),
      formatCoordinate(next.longitude),
    );
    // A message from an earlier try (or a backend one) is out of date now.
    void fields.validate();
    setPin(next);
    setSource(how);
    setMessage(null);
    setAnnouncement(
      how === "lookup" ? PIN_FROM_ADDRESS_ANNOUNCEMENT : describePin(next),
    );
    // A click or a drag happens on the map, so the map is already there. The other two come
    // from elsewhere and ask the map to go to the pin.
    if (how === "typed" || how === "lookup") {
      setView({
        kind: "pin",
        pin: next,
        zoom: how === "lookup" ? LOOKUP_ZOOM : PIN_ZOOM,
      });
    }
    if (how === "click" || how === "drag") reverse(next);
    return true;
  };

  /**
   * The street of the point the person picked, written into the address field (AC-9): wherever
   * they pick, the address becomes that place, replacing what was there, with the house number
   * when OpenStreetMap knows it and the road alone when it does not. Two cases leave the field
   * alone: the answer has no usable street (the line under the map says so), and the person
   * edited the field while the answer was on its way (their text is newer, so the answer is
   * dropped).
   */
  const reverse = (at: Pin) => {
    const addressAtStart = fields.readAddress();
    setMessage({ text: REVERSING_TEXT, busy: true });
    lookups.reverse.mutate(at, {
      onSuccess: (street) => {
        const text = streetText(street);
        if (text === null) {
          setMessage({ text: NO_ROAD_TEXT });
          return;
        }
        if (fields.readAddress() !== addressAtStart) {
          setMessage(null);
          return;
        }
        fields.writeAddress(text);
        setMessage({ text: filledAddressText(text) });
      },
      onError: (error) => {
        if (isAbortError(error)) return;
        setMessage({ text: REVERSE_FAILED_TEXT, retry: () => reverse(at) });
      },
    });
  };

  /**
   * "Tìm vị trí trên bản đồ" (AC-8): looks the typed address up and puts the pin on the first
   * result that passes the area check. It is the only way a typed address reaches the map: it
   * never runs when the address field is left or when the map opens. It may move a pin the
   * person placed before, because they asked for it.
   */
  const searchAddress = () => {
    if (!open || !ward) return;
    const addressText = fields.readAddress().trim();
    if (addressText === "") return;
    setMessage({ text: SEARCHING_TEXT, busy: true });
    lookups.search.mutate(
      {
        addressText,
        wardName: ward.name,
        provinceName: ward.provinceName,
        bounds: ward.bounds,
      },
      {
        onSuccess: (found) => {
          const hit = found
            .map(roundPin)
            .find((point) => checkPin(point, ward.bounds) === "ok");
          if (!hit) {
            setMessage({ text: notFoundText(ward.name) });
            return;
          }
          place(hit, "lookup");
        },
        onError: (error) => {
          if (isAbortError(error)) return;
          setMessage({ text: SEARCH_FAILED_TEXT, retry: searchAddress });
        },
      },
    );
  };

  /**
   * The number fields were left or Enter was pressed in one (AC-6). It never runs on a keystroke.
   * One box filled and the other empty waits quietly for the other box; the message for that
   * comes when the form is sent.
   */
  const applyFields = async () => {
    const { latitude, longitude } = fields.read();
    const lat = latitude.trim();
    const lng = longitude.trim();
    if ((lat === "") !== (lng === "")) {
      // A message from the last try is out of date now, and the new one waits for the submit.
      fields.clearErrors();
      return;
    }
    const valid = await fields.validate();
    if (lat === "" && lng === "") {
      // Emptying both boxes is the same as no pin.
      if (pin) {
        setPin(null);
        setSource(null);
        setAnnouncement(PIN_CLEARED_ANNOUNCEMENT);
      }
      return;
    }
    const typed = valid ? pinFromFields(lat, lng) : null;
    if (typed) place(typed, "typed");
  };

  /** "Xóa ghim": both fields, the marker and every note. The address text stays. */
  const clear = () => {
    abortLookups();
    fields.write("", "");
    fields.clearErrors();
    setPin(null);
    setSource(null);
    setMessage(null);
    setAnnouncement(PIN_CLEARED_ANNOUNCEMENT);
  };

  /**
   * The ward changed (AC-10). A pin that is still inside the new ward's allowed area stays.
   * Otherwise the pin and both fields are cleared with a note. The open map fits the new ward
   * either way. No lookup ever changes the ward.
   */
  const onWardChange = (next: LookupWard | null) => {
    abortLookups();
    const { latitude, longitude } = fields.read();
    const held = pinFromFields(latitude, longitude);
    if (held && checkPin(roundPin(held), next?.bounds ?? null) !== "ok") {
      fields.write("", "");
      fields.clearErrors();
      setPin(null);
      setSource(null);
      setMessage({ text: droppedPinNote(next?.name ?? CITY_NAME) });
    }
    setView({ kind: "ward", bounds: next?.bounds ?? null });
  };

  return {
    pin,
    source,
    message,
    announcement,
    view,
    busy: lookups.search.isPending || lookups.reverse.isPending,
    place,
    applyFields,
    clear,
    searchAddress,
    onWardChange,
    abortLookups,
  };
}

export type LocationPin = ReturnType<typeof useLocationPin>;
