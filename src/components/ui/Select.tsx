import React from "react";
import { cn } from "@/lib/utils/cn";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

export function Select({
  label,
  helperText,
  errorMessage,
  options,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const hasError = Boolean(errorMessage);
  const describedBy = [
    helperText ? `${selectId}-helper` : undefined,
    errorMessage ? `${selectId}-error` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
          className={cn(
            "w-full h-10 rounded-md border bg-white px-3 text-sm",
            "appearance-none outline-none pr-9",
            "transition-colors duration-150",
            "focus:ring-2 focus:ring-offset-0",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            hasError
              ? "border-error text-error focus:border-error focus:ring-red-200"
              : "border-border text-gray-900 focus:border-primary-500 focus:ring-primary-100",
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
      {helperText && !errorMessage && (
        <p id={`${selectId}-helper`} className="text-xs text-gray-500">
          {helperText}
        </p>
      )}
      {errorMessage && (
        <p id={`${selectId}-error`} className="text-xs text-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
