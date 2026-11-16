import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GOOD_TO_KNOW, GOOD_TO_KNOW_TITLE } from "../text";

/**
 * The zone "Cần biết trước khi mua" under the cards (spec 0021, AC-2): fixed copy, the same for
 * everyone, so it sits in the static shell and holds nothing about a plan. One `h2` for the zone
 * and an `h3` for each point, so the page outline stays one `h1`, then one `h2` per card and zone.
 */
export function GoodToKnow() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-base">{GOOD_TO_KNOW_TITLE}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-4 md:grid-cols-3">
          {GOOD_TO_KNOW.map(({ title, text }) => (
            <li key={title} className="flex flex-col gap-1">
              <h3 className="text-base">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
