import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

type AdSize = "banner" | "sidebar" | "square" | "leaderboard" | "infeed" | "rectangle";

interface AdBannerProps {
  size: AdSize;
  slot?: string;
  className?: string;
}

const AD_SIZES: Record<AdSize, { width: string; height: string; minHeight: string; label: string; format: string }> = {
  banner: { width: "w-full", height: "min-h-[90px]", minHeight: "90px", label: "728x90", format: "horizontal" },
  leaderboard: { width: "w-full", height: "min-h-[90px]", minHeight: "90px", label: "970x90", format: "horizontal" },
  sidebar: { width: "w-full", height: "min-h-[250px]", minHeight: "250px", label: "300x250", format: "rectangle" },
  rectangle: { width: "w-full", height: "min-h-[250px]", minHeight: "250px", label: "300x250", format: "rectangle" },
  square: { width: "w-full", height: "min-h-[250px]", minHeight: "250px", label: "250x250", format: "rectangle" },
  infeed: { width: "w-full", height: "min-h-[100px]", minHeight: "100px", label: "In-Feed", format: "fluid" },
};

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdBanner({ size, slot, className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const adConfig = AD_SIZES[size];
  const pushed = useRef(false);

  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  const adsEnabled = settings?.adsEnabled === "true" || settings?.adsEnabled === true;
  const adClientId = settings?.adSensePublisherId || "";

  const slotMap: Record<string, string> = {};
  if (settings?.adSlotHeader) slotMap["top-banner"] = settings.adSlotHeader;
  if (settings?.adSlotSidebar1) {
    slotMap["sidebar-1"] = settings.adSlotSidebar1;
    slotMap["sidebar-detail"] = settings.adSlotSidebar1;
  }
  if (settings?.adSlotSidebar2) slotMap["sidebar-2"] = settings.adSlotSidebar2;
  if (settings?.adSlotInfeed) slotMap["infeed"] = settings.adSlotInfeed;
  if (settings?.adSlotFooter) slotMap["bottom-banner"] = settings.adSlotFooter;

  const resolvedSlot = slot ? slotMap[slot] || "" : "";

  useEffect(() => {
    if (adsEnabled && adClientId && resolvedSlot && adRef.current && !pushed.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch (e) {
        console.log("AdSense push error:", e);
      }
    }
  }, [adsEnabled, adClientId, resolvedSlot]);

  if (!adsEnabled || !adClientId || !resolvedSlot) {
    return (
      <div 
        className={`${adConfig.width} ${adConfig.height} ${className} bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center relative overflow-hidden`}
        data-ad-slot={slot}
        data-testid={`ad-banner-${size}`}
      >
        <div className="text-center text-gray-400 dark:text-gray-500">
          <div className="text-[10px] font-medium">Ad Space</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${adConfig.width} ${className}`}
      data-testid={`ad-banner-${size}`}
      style={{ minHeight: adConfig.minHeight }}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", minHeight: adConfig.minHeight }}
        data-ad-client={adClientId}
        data-ad-slot={resolvedSlot}
        data-ad-format={adConfig.format === "fluid" ? "fluid" : "auto"}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export function InFeedAd({ className = "" }: { className?: string }) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  const adsEnabled = settings?.adsEnabled === "true" || settings?.adsEnabled === true;
  const adClientId = settings?.adSensePublisherId || "";
  const slotId = settings?.adSlotInfeed || "";

  useEffect(() => {
    if (adsEnabled && adClientId && slotId && adRef.current && !pushed.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch (e) {
        console.log("AdSense push error:", e);
      }
    }
  }, [adsEnabled, adClientId, slotId]);

  if (!adsEnabled || !adClientId || !slotId) {
    return (
      <div 
        className={`w-full min-h-[100px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center ${className}`}
        data-testid="ad-infeed"
      >
        <div className="text-center text-gray-400 dark:text-gray-500">
          <div className="text-[10px] font-medium">Ad Space</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`} data-testid="ad-infeed">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClientId}
        data-ad-slot={slotId}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
      />
    </div>
  );
}

export function SponsoredJobAd({ className = "" }: { className?: string }) {
  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/settings"],
  });

  const adsEnabled = settings?.adsEnabled === "true" || settings?.adsEnabled === true;
  const contactEmail = settings?.adContactEmail || settings?.contactEmail || "advertise@portal.com";

  return (
    <div 
      className={`p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-lg ${className}`}
      data-testid="sponsored-job-ad"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0 text-xs md:text-sm">
          AD
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">Sponsored</span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-xs md:text-sm mb-1">Advertise Here</h4>
          <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mb-2">Reach thousands of job seekers daily.</p>
          <a 
            href={`mailto:${contactEmail}?subject=Advertising Inquiry`}
            className="inline-flex items-center gap-1 text-[10px] md:text-xs text-blue-600 hover:underline font-medium"
          >
            Contact for Advertising <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
