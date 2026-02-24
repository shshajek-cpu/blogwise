"use client";

type AdPosition = "top-banner" | "in-feed" | "sidebar" | "in-article";

interface AdSlotProps {
  position: AdPosition;
  className?: string;
}

const dimensionMap: Record<AdPosition, { width: number; height: number; label: string }> = {
  "top-banner": { width: 728, height: 90, label: "상단 배너 광고" },
  "in-feed": { width: 600, height: 280, label: "피드 광고" },
  "sidebar": { width: 300, height: 250, label: "사이드바 광고" },
  "in-article": { width: 580, height: 200, label: "인-아티클 광고" },
};

const isDev = process.env.NODE_ENV !== "production";

export default function AdSlot({ position, className = "" }: AdSlotProps) {
  const { width, height, label } = dimensionMap[position];

  if (isDev) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 ${className}`}
        style={{ minHeight: height, maxWidth: width }}
        aria-label={label}
      >
        <div className="flex flex-col items-center gap-1 py-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">광고</span>
          <span className="text-xs text-gray-300">{width} × {height}</span>
          <span className="text-xs text-gray-300">{label}</span>
        </div>
      </div>
    );
  }

  // Production: render actual AdSense slot
  return (
    <div className={`overflow-hidden ${className}`} style={{ minHeight: height }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width, height }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={`blogwise-${position}`}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
