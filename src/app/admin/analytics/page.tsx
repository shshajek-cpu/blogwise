"use client";

import React, { useState, useEffect } from "react";
import { TrafficLineChart } from "@/components/admin/AnalyticsChart";
import { cn } from "@/lib/utils/cn";

const dateRanges = ["오늘", "7일", "30일", "3개월", "1년"] as const;

const periodMap: Record<string, string> = {
  "오늘": "7d",
  "7일": "7d",
  "30일": "30d",
  "3개월": "90d",
  "1년": "90d",
};

// Revenue estimation helper
function estimateRevenue(pageviews: number, rpmKRW: number = 800): number {
  return Math.floor((pageviews / 1000) * rpmKRW);
}

const mockTrafficData = [
  { day: "1/14", views: 980 },
  { day: "1/15", views: 1240 },
  { day: "1/16", views: 1560 },
  { day: "1/17", views: 1320 },
  { day: "1/18", views: 1890 },
  { day: "1/19", views: 2100 },
  { day: "1/20", views: 1750 },
];

const mockDevices = [
  { name: "모바일", pct: 58, color: "bg-primary-500" },
  { name: "데스크탑", pct: 34, color: "bg-success" },
  { name: "태블릿", pct: 8, color: "bg-warning" },
];

const mockReferrers = [
  { source: "구글 검색", visits: 2840, pct: 52 },
  { source: "네이버 검색", visits: 1240, pct: 23 },
  { source: "직접 접속", visits: 680, pct: 12 },
  { source: "소셜 미디어", visits: 540, pct: 10 },
  { source: "기타", visits: 163, pct: 3 },
];

interface AnalyticsData {
  todayViews: number;
  totalViews: number;
  publishedCount: number;
  draftCount: number;
  weeklyData: { day?: string; date?: string; views: number }[];
  topPosts: { id: string; title: string; view_count: number; slug: string }[];
  devices?: { name: string; count: number; percentage: number }[];
  referrers?: { source: string; count: number; percentage: number }[];
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>("7일");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive period from dateRange instead of using separate state
  const period = periodMap[dateRange] as '7d' | '30d' | '90d';

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data: AnalyticsData) => {
        setAnalytics(data);
      })
      .catch(() => {
        // Fall back to null (mock data will be used in render)
        setAnalytics(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [period]);

  // API returns { date, views } but charts expect { day, views } — normalize the key name
  const normalizedWeeklyData = analytics?.weeklyData?.map((d) => ({
    day: d.day ?? d.date ?? "",
    views: d.views,
  }));
  const chartData = normalizedWeeklyData?.length ? normalizedWeeklyData : mockTrafficData;
  const topPostsData = analytics?.topPosts ?? [];

  // Device data with fallback to mock
  const deviceColorMap: Record<string, string> = {
    mobile: "bg-primary-500",
    desktop: "bg-success",
    tablet: "bg-warning",
    모바일: "bg-primary-500",
    데스크탑: "bg-success",
    태블릿: "bg-warning",
  };
  const devices = analytics?.devices?.length
    ? analytics.devices.map((d) => ({
        name: d.name === 'mobile' ? '모바일' : d.name === 'desktop' ? '데스크탑' : d.name === 'tablet' ? '태블릿' : d.name,
        pct: d.percentage,
        color: deviceColorMap[d.name] ?? "bg-gray-400",
      }))
    : mockDevices;

  // Referrer data with fallback to mock
  const referrerNameMap: Record<string, string> = {
    google: "구글 검색",
    naver: "네이버 검색",
    direct: "직접 접속",
    social: "소셜 미디어",
    other: "기타",
  };
  const referrers = analytics?.referrers?.length
    ? analytics.referrers.map((r) => ({
        source: referrerNameMap[r.source] ?? r.source,
        visits: r.count,
        pct: r.percentage,
      }))
    : mockReferrers;

  const todayRevenue = analytics?.todayViews ? estimateRevenue(analytics.todayViews) : 0;
  const totalRevenue = analytics?.totalViews ? estimateRevenue(analytics.totalViews) : 0;

  const summaryStats = [
    {
      label: "오늘 페이지뷰",
      value: loading ? "..." : (analytics?.todayViews?.toLocaleString() ?? "0"),
      change: 12.5,
    },
    {
      label: "총 페이지뷰",
      value: loading ? "..." : (analytics?.totalViews?.toLocaleString() ?? "0"),
      change: 8.3,
    },
    {
      label: "발행된 글",
      value: loading ? "..." : (analytics?.publishedCount?.toLocaleString() ?? "0"),
      change: 5.1,
    },
    {
      label: "임시저장",
      value: loading ? "..." : (analytics?.draftCount?.toLocaleString() ?? "0"),
      change: 0,
    },
  ];

  const revenueStats = [
    {
      label: "오늘 예상 수익",
      value: loading ? "..." : `₩${todayRevenue.toLocaleString()}`,
      sublabel: "RPM ₩800 기준",
    },
    {
      label: `${dateRange} 예상 수익`,
      value: loading ? "..." : `₩${totalRevenue.toLocaleString()}`,
      sublabel: "광고 노출 기준",
    },
    {
      label: "월 예상 수익",
      value: loading ? "..." : `₩${(todayRevenue * 30).toLocaleString()}`,
      sublabel: "일 평균 기준",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">분석</h1>
          <p className="text-sm text-gray-500 mt-1">블로그 트래픽과 성과를 확인하세요.</p>
        </div>
        {/* Date range selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {dateRanges.map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                dateRange === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            {stat.change !== 0 && (
              <div className="flex items-center gap-1 mt-1">
                <span className={cn(
                  "text-xs font-medium",
                  stat.change >= 0 ? "text-success" : "text-error"
                )}>
                  {stat.change >= 0 ? "▲" : "▼"} {Math.abs(stat.change)}%
                </span>
                <span className="text-xs text-gray-400">전 기간 대비</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue estimation */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">💰</span>
          <h3 className="text-sm font-semibold text-gray-700">AdSense 수익 예측</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenueStats.map((stat, i) => (
            <div key={i} className="bg-white rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-purple-600 mt-1">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sublabel}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">
          * 예상 수익은 페이지뷰와 평균 RPM(₩800)을 기준으로 계산됩니다. 실제 수익은 광고 클릭률, 광고주 입찰가, 콘텐츠 주제 등에 따라 달라질 수 있습니다.
        </p>
      </div>

      {/* Traffic chart */}
      <TrafficLineChart
        data={chartData}
        title={`트래픽 추이 (${dateRange})`}
      />

      {/* Top posts (real data) */}
      {topPostsData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">인기 게시물</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {topPostsData.map((post, index) => {
              const rank = index + 1;
              return (
                <div key={post.id} className="px-6 py-3 flex items-center gap-4">
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    rank === 1 ? "bg-yellow-100 text-yellow-700" :
                    rank === 2 ? "bg-gray-100 text-gray-600" :
                    rank === 3 ? "bg-orange-100 text-orange-600" :
                    "bg-gray-50 text-gray-400"
                  )}>
                    {rank}
                  </span>
                  <p className="flex-1 text-sm font-medium text-gray-800 truncate">{post.title}</p>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{post.view_count.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">조회수</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top posts + Device breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top posts (mock fallback for UI completeness) */}
        {topPostsData.length === 0 && (
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">인기 게시글 TOP 5</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="px-6 py-8 text-center text-sm text-gray-400">로딩 중...</div>
              ) : (
                <div className="px-6 py-8 text-center text-sm text-gray-400">데이터가 없습니다.</div>
              )}
            </div>
          </div>
        )}

        {/* Device breakdown + referrers */}
        <div className={cn("space-y-4", topPostsData.length === 0 ? "" : "lg:col-span-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0")}>
          {/* Device */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">기기별 접속</h3>
            <div className="space-y-3">
              {devices.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{d.name}</span>
                    <span className="font-medium">{d.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", d.color)} style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referrers */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">유입 경로</h3>
            <div className="space-y-2">
              {referrers.map((r) => (
                <div key={r.source} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                    <span className="text-gray-700 truncate">{r.source}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-gray-500">{r.visits.toLocaleString()}</span>
                    <span className="text-gray-400 w-8 text-right">{r.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
