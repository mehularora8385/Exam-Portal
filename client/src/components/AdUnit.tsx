import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdUnitProps {
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  layout?: string;
  layoutKey?: string;
  className?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
}

export function AdUnit({
  slot = "",
  format = "auto",
  layout,
  layoutKey,
  className = "",
  style,
  responsive = true,
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    
    try {
      if (typeof window !== "undefined" && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} data-testid="ad-unit">
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style || { display: "block", minHeight: "100px" }}
        data-ad-client="ca-pub-7620603008087335"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
        {...(layout && { "data-ad-layout": layout })}
        {...(layoutKey && { "data-ad-layout-key": layoutKey })}
      />
    </div>
  );
}

export function InFeedAd({ className = "" }: { className?: string }) {
  return (
    <AdUnit
      format="fluid"
      layout="in-article"
      className={`my-4 ${className}`}
      style={{ display: "block", textAlign: "center" }}
    />
  );
}

export function DisplayAd({ className = "" }: { className?: string }) {
  return (
    <AdUnit
      format="auto"
      responsive={true}
      className={`my-6 ${className}`}
      style={{ display: "block", minHeight: "250px" }}
    />
  );
}

export function SidebarAd({ className = "" }: { className?: string }) {
  return (
    <AdUnit
      format="rectangle"
      className={`mb-4 ${className}`}
      style={{ display: "inline-block", width: "300px", height: "250px" }}
    />
  );
}

export function BannerAd({ className = "" }: { className?: string }) {
  return (
    <AdUnit
      format="horizontal"
      responsive={true}
      className={`my-4 ${className}`}
      style={{ display: "block", minHeight: "90px" }}
    />
  );
}
