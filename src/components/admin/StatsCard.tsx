import React from "react";
import { cn } from "@/lib/utils/cn";

interface StatsCardProps {
  label: string;
  value: string;
  trend?: {
    value: number; // percentage, positive = up, negative = down
    label?: string;
  };
  icon?: React.ReactNode;
  accentColor?: string;
  className?: string;
}

export function StatsCard({ label, value, trend, icon, accentColor = "bg-primary-500", className }: StatsCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded",
                  isPositive
                    ? "text-success bg-success-light"
                    : "text-error bg-error-light"
                )}
              >
                {isPositive ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {Math.abs(trend.value)}%
              </span>
              {trend.label && (
                <span className="text-xs text-gray-400">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0 ml-4", accentColor)}>
            {icon}
          </div>
        )}
      </div>
      <div className={cn("mt-4 h-1 rounded-full opacity-20", accentColor)} />
    </div>
  );
}
