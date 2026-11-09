import { useId, type ReactNode, type Ref } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type ReviewsZoneFrameProps = {
  /** The id of the zone, which the profile page and the hint link may point to. The gallery omits it. */
  id?: string;
  /** On the heading, so a page change or a closed dialog can move focus here (AC-11). */
  headingRef?: Ref<HTMLHeadingElement>;
  /** The line under the heading, or `null` while the profile is not loaded (AC-1). */
  countText: string | null;
  /** The sentence a screen reader hears after an action (AC-17). Never carries a comment. */
  announcement: string;
  children: ReactNode;
};

/**
 * The frame of the reviews zone (spec 0013, AC-1 and AC-17): one `Card` zone with the heading
 * "Đánh giá", the count under it, and the always mounted `role="status"` line. It only draws, so
 * `/dev/ui` can show the zone on fake data inside the same frame. The heading is a focus target
 * (`tabIndex={-1}`, not a control).
 */
export function ReviewsZoneFrame({
  id,
  headingRef,
  countText,
  announcement,
  children,
}: ReviewsZoneFrameProps) {
  const headingId = useId();

  return (
    <Card
      id={id}
      role="region"
      aria-labelledby={headingId}
      className="scroll-mt-24"
    >
      <CardHeader className="border-b">
        <h2
          ref={headingRef}
          id={headingId}
          tabIndex={-1}
          className="text-base outline-hidden"
        >
          Đánh giá
        </h2>
        {/* The count is `reviewCount` of the profile, never the length of the list. */}
        {countText !== null && (
          <p className="text-sm text-muted-foreground">{countText}</p>
        )}
      </CardHeader>
      <CardContent className="gap-5">
        {/* Always mounted, so the sentences that arrive later are read out. */}
        <span role="status" className="sr-only">
          {announcement}
        </span>
        {children}
      </CardContent>
    </Card>
  );
}
