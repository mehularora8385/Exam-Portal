import { useEffect, useRef } from "react";
import { usePortal } from "./use-portal";

function getSessionId(): string {
  let sid = sessionStorage.getItem("_vsid");
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem("_vsid", sid);
  }
  return sid;
}

export function usePageTracking(page: string) {
  const { portal } = usePortal();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const portalType = portal === "jobs" ? "jobs" : "exam";
    const sessionId = getSessionId();

    fetch("/api/track/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portal: portalType, page, sessionId }),
    }).catch(() => {});
  }, [page, portal]);
}
