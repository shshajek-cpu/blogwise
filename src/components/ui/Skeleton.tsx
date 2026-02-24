import React from "react";
import { cn } from "@/lib/utils/cn";

export type SkeletonVariant = "text" | "circle" | "rectangle" | "card";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const baseClasses = "animate-pulse bg-gray-200 rounded";

function SkeletonBox({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(baseClasses, className)}
      aria-hidden="true"
      style={style}
      {...props}
    />
  );
}

export function Skeleton({
  variant = "rectangle",
  width,
  height,
  lines = 3,
  className,
  style,
  ...props
}: SkeletonProps) {
  const inlineStyle: React.CSSProperties = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    ...style,
  };

  if (variant === "text") {
    return (
      <div
        className={cn("flex flex-col gap-2", className)}
        aria-busy="true"
        aria-label="Loading text"
        {...props}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBox
            key={i}
            className="h-4 rounded"
            style={{ width: i === lines - 1 ? "75%" : "100%" }}
          />
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <SkeletonBox
        className={cn("rounded-full", className)}
        style={{ width: width ?? 40, height: height ?? 40, ...style }}
        aria-busy="true"
        aria-label="Loading"
        {...props}
      />
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-lg border border-border p-5 flex flex-col gap-3",
          className
        )}
        aria-busy="true"
        aria-label="Loading card"
        {...props}
      >
        <SkeletonBox className="h-5 w-2/3 rounded" />
        <SkeletonBox className="h-4 w-full rounded" />
        <SkeletonBox className="h-4 w-5/6 rounded" />
        <SkeletonBox className="h-4 w-4/6 rounded" />
        <div className="flex gap-2 pt-2">
          <SkeletonBox className="h-8 w-20 rounded-md" />
          <SkeletonBox className="h-8 w-16 rounded-md" />
        </div>
      </div>
    );
  }

  // rectangle (default)
  return (
    <SkeletonBox
      className={cn("rounded-md", className)}
      style={inlineStyle}
      aria-busy="true"
      aria-label="Loading"
      {...props}
    />
  );
}
