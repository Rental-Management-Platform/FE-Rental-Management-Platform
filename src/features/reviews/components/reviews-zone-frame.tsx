import { useId, type ReactNode, type Ref } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type ReviewsZoneFrameProps = {
  /** The id of the zone, which a page or a hint link may point to. The gallery omits it. */
  id?: string;
  /** The heading: "Đánh giá" for a landlord, "Đánh giá phòng" for a room. */
  heading: string;
  /** On the heading, so a page change or a closed dialog can move focus here (AC-11). */
  headingRef?: Ref<HTMLHeadingElement>;
  /** The line under the heading: a count or a score, or `null` while it is not known (AC-1). */
  summary: ReactNode;
  /** The sentence a screen reader hears after an action (AC-17). Never carries a comment. */
  announcement: string;
  children: ReactNode;
};

/**
 * The frame of a reviews area (spec 0013, AC-1 and AC-17, and spec 0014, AC-1): one `Card` zone with
 * the heading, the line under it, and the always mounted `role="status"` line. It only draws, so
 * `/dev/ui` can show the zone on fake data inside the same frame. The heading is a focus target
 * (`tabIndex={-1}`, not a control).
 */
export function ReviewsZoneFrame({
  id,
  heading,
  headingRef,
  summary,
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
          {heading}
        </h2>
        {/* The numbers are those of the subject (the profile or the listing summary), never the
            length of the list. */}
        {summary}
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
