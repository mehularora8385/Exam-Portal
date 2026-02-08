import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export type PortalType = "exam" | "jobs";

const KNOWN_JOB_DOMAINS = ["rojgar-hub.com", "rogar-hub.com", "rojgarhub.com"];

function isJobHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower.includes("rojgarhub") || lower.includes("rogar-hub") || lower.includes("rojgar-hub");
}

function isDedicatedJobHostname(hostname: string, configuredDomain?: string): boolean {
  const lower = hostname.toLowerCase();
  if (isJobHostname(lower)) return true;
  if (configuredDomain) {
    const cleanDomain = configuredDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
    if (lower === cleanDomain || lower === `www.${cleanDomain}` || lower.includes(cleanDomain)) {
      return true;
    }
  }
  return false;
}

function getJobPortalUrl(configuredDomain?: string): string | null {
  if (configuredDomain) {
    const clean = configuredDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${clean}`;
  }
  for (const domain of KNOWN_JOB_DOMAINS) {
    if (!window.location.hostname.toLowerCase().includes(domain.split(".")[0])) {
      return `https://${domain}`;
    }
  }
  return `https://${KNOWN_JOB_DOMAINS[0]}`;
}

export function usePortal(): { 
  portal: PortalType; 
  isJobPortal: boolean; 
  isExamPortal: boolean; 
  isDedicatedDomain: boolean; 
  jobBasePath: string;
  jobPortalUrl: string | null;
} {
  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  return useMemo(() => {
    const hostname = window.location.hostname;
    const configuredDomain = settings?.jobPortalDomain;
    const dedicated = isDedicatedJobHostname(hostname, configuredDomain);
    const portal: PortalType = dedicated ? "jobs" : "exam";
    const jobPortalUrl = dedicated ? null : getJobPortalUrl(configuredDomain);

    return {
      portal,
      isJobPortal: portal === "jobs",
      isExamPortal: portal === "exam",
      isDedicatedDomain: dedicated,
      jobBasePath: dedicated ? "/jobs" : "/job-alerts",
      jobPortalUrl,
    };
  }, [settings?.jobPortalDomain]);
}

export function isOnDedicatedJobDomain(): boolean {
  return isJobHostname(window.location.hostname);
}
