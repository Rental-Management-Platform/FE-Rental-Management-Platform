"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Whether an element has come near the screen (spec 0018, AC-2). `seen` turns true once the
 * element is within `margin` pixels of the viewport, and then stays true, so a map that was
 * loaded is never thrown away by scrolling past it. Attach `ref` to the element.
 */
export function useInView<T extends Element>(margin = 200) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setSeen(true);
      },
      { rootMargin: `${margin}px` },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [margin, seen]);

  return { ref, seen };
}
