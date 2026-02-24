"use client";

import React, { useState, useEffect } from "react";
import { StatsCard } from "@/components/admin/StatsCard";
import { WeeklyBarChart, AIPieChart } from "@/components/admin/AnalyticsChart";
import { cn } from "@/lib/utils/cn";

const weeklyData = [
  { day: "월", views: 1240 },
  { day: "화", views: 980 },
  { day: "수", views: 1560 },
  { day: "목", views: 1320 },
  { day: "금", views: 1890 },
  { day: "토", views: 2100 },
  { day: "일", views: 1750 },
];

const aiUsageData = [
  { name: "OpenAI", value: 48, color: "#10A37F" },
  { name: "Claude", value: 31, color: "#D97706" },
  { name: "Gemini", value: 21, color: "#4285F4" },
];

const mockRecentPosts = [
  { id: 1, title: "2025 최신 Next.js 15 완전 가이드", status: "발행됨", date: "2025-01-20", views: 3420 },
  { id: 2, title: "TypeScript 고급 패턴 10가지", status: "발행됨", date: "2025-01-19", views: 2180 },
  { id: 3, title: "React 19 새 기능 총정리", status: "초안", date: "2025-01-18", views: 0 },
  { id: 4, title: "Tailwind CSS v4 마이그레이션 방법", status: "예약", date: "2025-01-22", views: 0 },
  { id: 5, title: "Supabase + Next.js 인증 구현하기", status: "발행됨", date: "2025-01-17", views: 1890 },
];

const crawlLogs = [
  { source: "네이버 블로그", count: 24, status: "완료", time: "10분 전" },
  { source: "유튜브 채널", count: 8, status: "완료", time: "1시간 전" },
  { source: "티스토리", count: 15, status: "완료", time: "3시간 전" },
  { source: "Medium", count: 0, status: "실패", time: "5시간 전" },
  { source: "Dev.to", count: 12, status: "완료", time: "6시간 전" },
];

const statusBadgeClass: Record<string, string> = {
  "발행됨": "bg-success-light text-success",
  "초안": "bg-gray-100 text-gray-600",
  "예약": "bg-scheduled-light text-scheduled",
  "보관": "bg-warning-light text-warning",
};

const crawlStatusClass: Record<string, string> = {
  "완료": "bg-success-light text-success",
  "실패": "bg-error-light text-error",
  "진행중": "bg-info-light text-info",
};

interface RecentPost {
  id: number;
  title: string;
  status: string;
  date: string;
  views: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayViews: "1,234",
    totalPublished: "156",
    pendingGeneration: "8",
    monthlyRevenue: "₩45,200",
  });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>(mockRecentPosts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [analyticsRes, postsRes] = await Promise.all([
          fetch("/api/analytics"),
          fetch("/api/posts?limit=5&sort=latest"),
        ]);
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          // Analytics API has no draftCount; draft count comes from posts counts below
          setStats((prev) => ({
            ...prev,
            todayViews: data.todayViews?.toLocaleString() ?? "0",
            totalPublished: data.publishedCount?.toLocaleString() ?? "0",
          }));
        }
        if (postsRes.ok) {
          const data = await postsRes.json();
          // Use posts API counts to populate draftCount
          if (data.counts) {
            setStats((prev) => ({
              ...prev,
              totalPublished: data.counts.published?.toLocaleString() ?? prev.totalPublished,
              pendingGeneration: data.counts.draft?.toLocaleString() ?? "0",
            }));
          }
          if (data.posts && data.posts.length > 0) {
            setRecentPosts(
              data.posts.map((p: { id: number; title: string; status: string; created_at: string; view_count: number }) => ({
                id: p.id,
                title: p.title,
                status: p.status === "published" ? "발행됨"
                  : p.status === "draft" ? "초안"
                  : p.status === "scheduled" ? "예약"
                  : p.status === "archived" ? "보관"
                  : p.status,
                date: p.created_at ? p.created_at.slice(0, 10) : "",
                views: p.view_count ?? 0,
              }))
            );
          }
        }
      } catch {
        // Keep mock data on error
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-1">Blogwise 관리자 현황을 한눈에 확인하세요.</p>
      </div>

      {/* Row 1: Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="오늘 페이지뷰"
          value={loading ? "..." : stats.todayViews}
          trend={{ value: 12.5, label: "어제 대비" }}
          icon="📊"
          accentColor="bg-primary-500"
        />
        <StatsCard
          label="총 발행 글"
          value={loading ? "..." : stats.totalPublished}
          trend={{ value: 3.2, label: "이번 달" }}
          icon="📝"
          accentColor="bg-success"
        />
        <StatsCard
          label="AI 생성 대기"
          value={loading ? "..." : stats.pendingGeneration}
          trend={{ value: -25, label: "어제 대비" }}
          icon="🤖"
          accentColor="bg-warning"
        />
        <StatsCard
          label="이번 달 수익"
          value={loading ? "..." : stats.monthlyRevenue}
          trend={{ value: 8.1, label: "지난 달 대비" }}
          icon="💰"
          accentColor="bg-purple-500"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WeeklyBarChart
          data={weeklyData}
          title="주간 트래픽"
          className="lg:col-span-2"
        />
        <AIPieChart
          data={aiUsageData}
          title="AI 제공사 사용 현황"
        />
      </div>

      {/* Row 3: Recent posts + Crawl log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent posts */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">최근 게시글</h3>
            <a href="/admin/contents" className="text-xs text-primary-600 hover:underline">전체 보기</a>
          </div>
          <div className="divide-y divide-gray-100">
            {recentPosts.map((post) => (
              <div key={post.id} className="px-6 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{post.date}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusBadgeClass[post.status] ?? "bg-gray-100 text-gray-600")}>
                    {post.status}
                  </span>
                  {post.views > 0 && (
                    <span className="text-xs text-gray-400">{post.views.toLocaleString()}뷰</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crawl log */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">크롤링 로그</h3>
            <a href="/admin/crawl" className="text-xs text-primary-600 hover:underline">관리하기</a>
          </div>
          <div className="divide-y divide-gray-100">
            {crawlLogs.map((log, i) => (
              <div key={i} className="px-6 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{log.source}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{log.time}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {log.count > 0 && (
                    <span className="text-xs text-gray-500">{log.count}건</span>
                  )}
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", crawlStatusClass[log.status] ?? "bg-gray-100 text-gray-600")}>
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Quick actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 py-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">빠른 실행</h3>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors border border-primary-200">
            <span>🔍</span> 크롤링 실행
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-success-light text-success hover:opacity-80 transition-opacity border border-green-200">
            <span>✨</span> AI 글 생성
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200">
            <span>🗺️</span> 사이트맵 갱신
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-warning-light text-warning hover:opacity-80 transition-opacity border border-yellow-200">
            <span>📤</span> 일괄 발행
          </button>
        </div>
      </div>
    </div>
  );
}
