"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

export type ToastVariant = "success" | "error" | "warning" | "info";

const variantConfig: Record<
  ToastVariant,
  { container: string; icon: React.ReactNode; progressBar: string }
> = {
  success: {
    container: "bg-white border-green-500",
    progressBar: "bg-green-500",
    icon: (
      <svg
        className="h-5 w-5 text-green-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  error: {
    container: "bg-white border-red-500",
    progressBar: "bg-red-500",
    icon: (
      <svg
        className="h-5 w-5 text-red-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  warning: {
    container: "bg-white border-yellow-500",
    progressBar: "bg-yellow-500",
    icon: (
      <svg
        className="h-5 w-5 text-yellow-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  info: {
    container: "bg-white border-blue-500",
    progressBar: "bg-blue-500",
    icon: (
      <svg
        className="h-5 w-5 text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

interface ToastProps {
  id?: string;
  variant?: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
  onDismiss?: () => void;
}

export function Toast({
  variant = "info",
  title,
  message,
  duration = 5000,
  onDismiss,
}: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const step = 100 / (duration / 50);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p - step;
        if (next <= 0) {
          clearInterval(intervalRef.current!);
          setVisible(false);
          setTimeout(() => onDismiss?.(), 300);
          return 0;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(intervalRef.current!);
  }, [duration, onDismiss]);

  const config = variantConfig[variant];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "relative w-80 rounded-lg border-l-4 shadow-lg overflow-hidden",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        config.container
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span className="shrink-0 mt-0.5">{config.icon}</span>
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold text-gray-900">{title}</p>
          )}
          <p className={cn("text-sm text-gray-600", title ? "mt-0.5" : "")}>
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onDismiss?.(), 300);
          }}
          className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100">
        <div
          className={cn("h-full transition-all ease-linear", config.progressBar)}
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

// Toast container for stacking multiple toasts
interface ToastItem {
  id: string;
  variant?: ToastVariant;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 items-end"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>,
    document.body
  );
}
