"use client";

import { RouteError } from "@/components/states/route-error";

export default function TenantError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <RouteError error={error} retry={retry} />;
}
