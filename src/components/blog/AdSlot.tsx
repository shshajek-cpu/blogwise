"use client";

import { useEffect, useMemo } from "react";

type AdPosition = "top-banner" | "in-feed" | "sidebar" | "in-article" | "responsive";
type AdFormat = "auto" | "rectangle" | "vertical" | "horizontal";

interface AdSlotProps {
  position: AdPosition;
  className?: string;
  format?: AdFormat;
  responsive?: boolean;
}

const dimensionMap: Record<AdPosition, { width: number; height: number; label: string; format: AdFormat }> = {
  "top-banner": { width: 728, height: 90, label: "상단 배너 광고", format: "horizontal" },
  "in-feed": { width: 600, height: 280, label: "피드 광고", format: "rectangle" },
  "sidebar": { width: 300, height: 250, label: "사이드바 광고", format: "vertical" },
  "in-article": { width: 580, height: 200, label: "인-아티클 광고", format: "auto" },
  "responsive": { width: 0, height: 0, label: "반응형 광고", format: "auto" },
};

const isDev = process.env.NODE_ENV !== "production";
const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-XXXXXXXXXXXXXXXX";

export default function AdSlot({ position, className = "", format, responsive = true }: AdSlotProps) {
  const { width, height, label, format: defaultFormat } = dimensionMap[position];
  const adFormat = format || defaultFormat;
  const isResponsive = position === "responsive" || responsive;

  useEffect(() => {
    if (!isDev && typeof window !== "undefined") {
      try {
        // @ts-expect-error adsbygoogle is loaded by Google
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, []);

  if (isDev) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 ${className}`}
        style={{
          minHeight: height || 100,
          maxWidth: width || "100%",
          width: isResponsive ? "100%" : width
        }}
        aria-label={label}
      >
        <div className="flex flex-col items-center gap-1 py-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">광고</span>
          {width > 0 && height > 0 && (
            <span className="text-xs text-gray-300">{width} × {height}</span>
          )}
          <span className="text-xs text-gray-300">{label}</span>
          <span className="text-xs text-gray-400">Format: {adFormat}</span>
        </div>
      </div>
    );
  }

  // Production: render actual AdSense slot
  // Use useMemo to ensure stable ID across re-renders
  const adSlot = useMemo(() => `blogwise-${position}-${Date.now().toString(36)}`, [position]);

  return (
    <div className={`overflow-hidden ${className}`} style={{ minHeight: height || "auto" }}>
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          ...(isResponsive ? {} : { width, height })
        }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={isResponsive ? "true" : "false"}
      />
    </div>
  );
}
