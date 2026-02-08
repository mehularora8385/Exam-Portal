import { useMemo } from "react";

export function useSubdomain(): string | null {
  return useMemo(() => {
    const hostname = window.location.hostname;
    
    // Skip subdomain detection for localhost, IP addresses, or replit.dev domains
    if (
      hostname === "localhost" ||
      hostname.match(/^\d+\.\d+\.\d+\.\d+$/) ||
      hostname.endsWith(".replit.dev") ||
      hostname.endsWith(".repl.co")
    ) {
      return null;
    }
    
    // Split hostname by dots
    const parts = hostname.split(".");
    
    // If we have more than 2 parts (e.g., RRB.examinationportal.com), 
    // the first part is the subdomain
    if (parts.length > 2) {
      const subdomain = parts[0].toUpperCase();
      // Skip common subdomains that aren't exam-specific
      if (subdomain === "WWW" || subdomain === "API" || subdomain === "ADMIN") {
        return null;
      }
      return subdomain;
    }
    
    return null;
  }, []);
}

export function getSubdomain(): string | null {
  const hostname = window.location.hostname;
  
  if (
    hostname === "localhost" ||
    hostname.match(/^\d+\.\d+\.\d+\.\d+$/) ||
    hostname.endsWith(".replit.dev") ||
    hostname.endsWith(".repl.co")
  ) {
    return null;
  }
  
  const parts = hostname.split(".");
  
  if (parts.length > 2) {
    const subdomain = parts[0].toUpperCase();
    if (subdomain === "WWW" || subdomain === "API" || subdomain === "ADMIN") {
      return null;
    }
    return subdomain;
  }
  
  return null;
}
