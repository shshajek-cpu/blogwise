"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar, HamburgerButton } from "@/components/admin/Sidebar";
import { cn } from "@/lib/utils/cn";
import { GenerationProvider } from "@/contexts/GenerationContext";
import GenerationProgressFloat from "@/components/admin/GenerationProgressFloat";

const breadcrumbMap: Record<string, string> = {
  "/admin": "대시보드",
  "/admin/crawl": "콘텐츠 생성",
  "/admin/contents": "콘텐츠 관리",
  "/admin/analytics": "분석",
  "/admin/settings": "설정",
};

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const currentLabel = breadcrumbMap[pathname] ?? "관리자";

  return (
    <GenerationProvider>
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center gap-4">
          <HamburgerButton onClick={() => setSidebarOpen(true)} />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm flex-1 min-w-0">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              홈
            </Link>
            {pathname !== "/admin" && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-gray-700 font-medium truncate">{currentLabel}</span>
              </>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <BellIcon />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
            </button>
            <Link
              href="/admin/crawl"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md",
                "bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              )}
            >
              <SparkleIcon />
              <span className="hidden sm:inline">새 글 생성</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
      <GenerationProgressFloat />
    </div>
    </GenerationProvider>
  );
}
