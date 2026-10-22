import { notFound } from "next/navigation";
import { SessionLab } from "./session-lab";

// A temporary page to try the API client and the session by hand. It answers 404 in a
// production build, and goes away when the real login screen ships.
export default function DevSessionPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SessionLab />;
}
