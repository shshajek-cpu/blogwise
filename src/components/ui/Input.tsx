import React from "react";
import { cn } from "@/lib/utils/cn";

export type InputSize = "sm" | "md";
export type InputVariant = "default" | "error";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  variant?: InputVariant;
  size?: InputSize;
  iconLeft?: React.ReactNode;
}

const sizeClasses: Record<InputSize, string> = {
  sm: "h-8 text-sm px-3",
  md: "h-10 text-sm px-3",
};

const iconPaddingClasses: Record<InputSize, string> = {
  sm: "pl-8",
  md: "pl-10",
};

const iconContainerClasses: Record<InputSize, string> = {
  sm: "left-2.5 h-3.5 w-3.5",
  md: "left-3 h-4 w-4",
};

export function Input({
  label,
  helperText,
  errorMessage,
  variant,
  size = "md",
  iconLeft,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const hasError = variant === "error" || Boolean(errorMessage);
  const describedBy = [
    helperText ? `${inputId}-helper` : undefined,
    errorMessage ? `${inputId}-error` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <span
            className={cn(
              "absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none",
              iconContainerClasses[size]
            )}
            aria-hidden="true"
          >
            {iconLeft}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
          className={cn(
            "w-full rounded-md border bg-white outline-none",
            "transition-colors duration-150",
            "placeholder:text-gray-400",
            "focus:ring-2 focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            sizeClasses[size],
            iconLeft ? iconPaddingClasses[size] : "",
            hasError
              ? "border-error text-error focus:border-error focus:ring-red-200"
              : "border-border text-gray-900 focus:border-primary-500 focus:ring-primary-100",
            className
          )}
          {...props}
        />
      </div>
      {helperText && !errorMessage && (
        <p id={`${inputId}-helper`} className="text-xs text-gray-500">
          {helperText}
        </p>
      )}
      {errorMessage && (
        <p id={`${inputId}-error`} className="text-xs text-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
