import type { Metadata } from "next";
import { PublicShell } from "@/components/shells/public-shell";
import { PreviewContent } from "../preview-content";
import { SAMPLE_NAV } from "../sample-nav";

export const metadata: Metadata = { title: "Khung công khai (xem trước)" };

export default function PublicShellPreview() {
  return (
    <PublicShell nav={SAMPLE_NAV}>
      <PreviewContent title="Khung công khai" contained />
    </PublicShell>
  );
}
