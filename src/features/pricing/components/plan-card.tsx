import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Plan } from "@/lib/api/types";
import { formatMoney } from "@/lib/format";
import { planPoints } from "../text";

/**
 * One plan, shown as the API gave it (spec 0021, AC-2): the name as an `h2`, the price for one
 * period, and three points. Nothing about the plan is written here and nothing is computed from
 * it. It runs on the server, so `footer` is where a client control goes (the buy button).
 * `empty:hidden` drops the footer when that control draws nothing for this viewer.
 */
export function PlanCard({ plan, footer }: { plan: Plan; footer: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="text-xl break-words">{plan.name}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="text-3xl font-semibold tabular-nums">
          {formatMoney(plan.price)}
          <span className="text-base font-normal text-muted-foreground">
            {" "}
            mỗi {plan.durationDays} ngày
          </span>
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          {planPoints(plan).map((point) => (
            <li key={point} className="flex items-start gap-2">
              <CheckIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary"
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto empty:hidden">{footer}</CardFooter>
    </Card>
  );
}
