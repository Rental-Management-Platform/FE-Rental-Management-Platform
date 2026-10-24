import type { SessionState } from "@/lib/session/create-session";
import { EndedNotice } from "./ended-notice";
import { UnavailableNotice } from "./unavailable-notice";

interface SessionNoticeProps {
  guest: Extract<SessionState, { status: "guest" }>;
  retrying: boolean;
  onRetry: () => void;
}

// The one notice above an auth form: the reason a session ended, or the retry for a session
// that could not be checked. A plain guest sees nothing.
export function SessionNotice({
  guest,
  retrying,
  onRetry,
}: SessionNoticeProps) {
  return guest.endedReason === "unavailable" ? (
    <UnavailableNotice onRetry={onRetry} retrying={retrying} />
  ) : (
    <EndedNotice reason={guest.endedReason} />
  );
}
