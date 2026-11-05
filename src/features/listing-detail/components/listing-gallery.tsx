"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ImagePlaceholder } from "@/components/states/image-placeholder";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";

/** A photo already prepared by the server: its id, and the address made by `mediaUrl`. */
export type GalleryPhoto = { id: string; src: string };

// The width of one slide in the two column layout of the page (page padding 16 px, 24 px from
// md, content at most 1152 px, a 22 rem column and a 24 px gap from lg).
const SLIDE_SIZES =
  "(min-width: 1152px) 728px, (min-width: 1024px) calc(100vw - 424px), (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)";

const NO_PHOTO_LINE = "Tin này chưa có ảnh.";

/**
 * The photos of one listing (spec 0010, AC-6). It stands on the canvas, not in a card.
 *
 * - No photo: the placeholder and a line. One photo: the photo only.
 * - Two to five photos: slides that swipe with CSS scroll snap (no script is needed to swipe),
 *   a strip of thumbnail buttons and a counter.
 * - Each slide shows the whole photo (`object-contain`), never cropped.
 * - A photo that fails to load leaves the slides and the strip, and the counter follows. If every
 *   photo fails, the whole section draws nothing, with no error and no gap.
 */
export function ListingGallery({
  title,
  photos,
}: {
  /** The listing title, the start of every photo's alternative text. */
  title: string;
  /** At most 5, in the order to show. */
  photos: readonly GalleryPhoto[];
}) {
  const headingId = useId();
  const slidesRef = useRef<HTMLDivElement>(null);
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);

  const markFailed = (id: string) =>
    setFailedIds((previous) =>
      previous.has(id) ? previous : new Set(previous).add(id),
    );

  // A photo can fail before the page becomes interactive, and `onError` can miss that: when the
  // image element is mounted, a finished load with no width is a failed one.
  const checkLoaded = (id: string) => (image: HTMLImageElement | null) => {
    if (image !== null && image.complete && image.naturalWidth === 0) {
      markFailed(id);
    }
  };

  if (photos.length === 0) {
    return (
      <section aria-labelledby={headingId} className="flex flex-col gap-2">
        <h2 id={headingId} className="sr-only">
          Ảnh của tin
        </h2>
        <ImagePlaceholder
          ratio="4:3"
          className="border bg-card [&_svg]:size-16"
        />
        <p className="text-sm text-muted-foreground">{NO_PHOTO_LINE}</p>
      </section>
    );
  }

  const visible = photos.filter((photo) => !failedIds.has(photo.id));
  if (visible.length === 0) return null;

  const count = visible.length;
  const current = Math.min(activeIndex, count - 1);

  // The slide in view is the one the scroll position points at, so the swipe stays native.
  const followScroll = () => {
    const slides = slidesRef.current;
    if (slides === null || slides.clientWidth === 0) return;
    setActiveIndex(Math.round(slides.scrollLeft / slides.clientWidth));
  };

  const showPhoto = (index: number) => {
    const slides = slidesRef.current;
    if (slides === null) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    slides.scrollTo({
      left: index * slides.clientWidth,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="sr-only">
        Ảnh của tin
      </h2>

      {/* The scroller can take focus, so a keyboard can move between slides with the arrows. */}
      <div
        ref={slidesRef}
        role="group"
        aria-label="Các ảnh của tin"
        tabIndex={0}
        onScroll={followScroll}
        className={cn(
          "[scrollbar-width:none] overflow-x-auto rounded-xl border bg-muted [&::-webkit-scrollbar]:hidden",
          "snap-x snap-mandatory",
          FOCUS_RING,
        )}
      >
        <ul className="flex">
          {visible.map((photo, index) => (
            <li
              key={photo.id}
              className="relative aspect-4/3 w-full shrink-0 snap-center"
            >
              <Image
                ref={checkLoaded(photo.id)}
                src={photo.src}
                alt={
                  count === 1
                    ? title
                    : `${title}, ảnh ${index + 1} trên ${count}`
                }
                fill
                sizes={SLIDE_SIZES}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                onError={() => markFailed(photo.id)}
                className="object-contain"
              />
            </li>
          ))}
        </ul>
      </div>

      {count > 1 && (
        <div className="flex items-center justify-between gap-3">
          <ul className="flex gap-2 overflow-x-auto p-1">
            {visible.map((photo, index) => (
              <li key={photo.id}>
                <button
                  type="button"
                  aria-label={`Xem ảnh ${index + 1} trên ${count}`}
                  aria-current={index === current ? "true" : undefined}
                  onClick={() => showPhoto(index)}
                  className={cn(
                    "relative block size-16 overflow-hidden rounded-lg border bg-muted",
                    FOCUS_RING,
                    index === current &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  <Image
                    ref={checkLoaded(photo.id)}
                    src={photo.src}
                    alt=""
                    fill
                    sizes="64px"
                    loading="lazy"
                    onError={() => markFailed(photo.id)}
                    className="object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
          {/* Hidden from screen readers: the button labels and `aria-current` already say which
              photo is shown, and a live region would speak on every swipe. */}
          <p
            aria-hidden="true"
            className="shrink-0 text-sm text-muted-foreground tabular-nums"
          >
            Ảnh {current + 1}/{count}
          </p>
        </div>
      )}
    </section>
  );
}
