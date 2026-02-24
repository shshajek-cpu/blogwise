"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

interface CrawlSource {
  id: string;
  name: string;
  platform: string;
  url: string;
  status: "active" | "inactive";
  lastCrawled: string;
  itemCount: number;
}

type KeywordTypeFilter = "all" | "trending" | "evergreen" | "seasonal";

interface TrendTopic {
  keyword: string;
  trendScore: number;
  estimatedCPC: number;
  revenuePotential: "high" | "medium" | "low";
  source?: string;
  category?: string;
  keywordType?: "evergreen" | "seasonal" | "trending";
  reason?: string;
}

interface PipelineResult {
  executedAt: string;
  contentGenerated: number;
  errorCount: number;
  errorMessages: string[];
  items: { title: string; keyword: string; success: boolean }[];
}

type PipelineStep = "idle" | "trends" | "benchmark" | "generate" | "done" | "error";
const STEP_LABELS: Record<PipelineStep, string> = {
  idle: "",
  trends: "트렌딩 키워드 분석 중...",
  benchmark: "인기 콘텐츠 벤치마킹 중...",
  generate: "AI 글 생성 중...",
  done: "완료!",
  error: "오류 발생",
};

const PLATFORM_OPTIONS = [
  { label: "네이버 블로그", value: "naver_blog" },
  { label: "네이버 뉴스", value: "naver_news" },
  { label: "유튜브", value: "youtube" },
  { label: "티스토리", value: "tistory" },
  { label: "커뮤니티", value: "community" },
  { label: "일반", value: "generic" },
];

const PLATFORM_LABEL: Record<string, string> = {
  naver_blog: "네이버 블로그",
  naver_news: "네이버 뉴스",
  youtube: "유튜브",
  tistory: "티스토리",
  community: "커뮤니티",
  generic: "일반",
};

const platformBadge: Record<string, string> = {
  naver_blog: "bg-green-100 text-green-700",
  naver_news: "bg-blue-100 text-blue-700",
  youtube: "bg-red-100 text-red-700",
  tistory: "bg-orange-100 text-orange-700",
  community: "bg-purple-100 text-purple-700",
  generic: "bg-gray-100 text-gray-600",
  // legacy labels from mock data
  "네이버 블로그": "bg-green-100 text-green-700",
  "유튜브 채널": "bg-red-100 text-red-700",
  "티스토리": "bg-orange-100 text-orange-700",
  "외부 블로그": "bg-gray-100 text-gray-600",
};

const sourceBadge: Record<string, { label: string; color: string }> = {
  google: { label: "Google", color: "bg-blue-100 text-blue-700" },
  naver: { label: "Naver", color: "bg-green-100 text-green-700" },
  daum: { label: "Daum", color: "bg-yellow-100 text-yellow-700" },
  evergreen: { label: "Evergreen", color: "bg-emerald-100 text-emerald-700" },
};

const keywordTypeBadge: Record<string, { label: string; color: string }> = {
  evergreen: { label: "연중 수요", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  seasonal: { label: "시즌", color: "bg-amber-50 text-amber-700 border-amber-200" },
  trending: { label: "실시간", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

const KEYWORD_TYPE_TABS: { key: KeywordTypeFilter; label: string; desc: string }[] = [
  { key: "all", label: "전체", desc: "모든 키워드" },
  { key: "evergreen", label: "연중 수요", desc: "1년 내내 꾸준히 검색되는 키워드" },
  { key: "seasonal", label: "시즌 키워드", desc: "이번 달에 검색이 급증하는 키워드" },
  { key: "trending", label: "실시간 트렌드", desc: "지금 급상승 중인 키워드" },
];

const revenueColor: Record<string, string> = {
  high: "text-green-600",
  medium: "text-yellow-600",
  low: "text-gray-400",
};

const revenueBars: Record<string, string> = {
  high: "■■■■■",
  medium: "■■■■",
  low: "■■",
};

const trendIcon = (score: number) => {
  if (score >= 90) return "🔴";
  if (score >= 75) return "🟡";
  return "🟢";
};

const MOCK_SOURCES: CrawlSource[] = [
  {
    id: "1",
    name: "네이버 개발 블로그",
    platform: "naver_blog",
    url: "https://blog.naver.com/naver_d2",
    status: "active",
    lastCrawled: "2025-01-20 14:30",
    itemCount: 342,
  },
  {
    id: "2",
    name: "코딩애플 유튜브",
    platform: "youtube",
    url: "https://youtube.com/@codingapple",
    status: "active",
    lastCrawled: "2025-01-20 13:15",
    itemCount: 128,
  },
];

export default function CrawlPage() {
  const [sources, setSources] = useState<CrawlSource[]>([]);
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [crawlingSourceId, setCrawlingSourceId] = useState<string | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("idle");
  const [pipelineKeyword, setPipelineKeyword] = useState("");
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalPlatform, setModalPlatform] = useState("naver_blog");
  const [modalUrl, setModalUrl] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [runAllCrawling, setRunAllCrawling] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [keywordTypeFilter, setKeywordTypeFilter] = useState<KeywordTypeFilter>("all");

  // ── Fetch sources ──────────────────────────────────────────────────────────
  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/crawl/sources");
      if (!res.ok) throw new Error("sources fetch failed");
      const data = await res.json();
      setSources(data.sources ?? data);
    } catch {
      setSources(MOCK_SOURCES);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch trends ───────────────────────────────────────────────────────────
  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const res = await fetch("/api/crawl/trends?analyze=true");
      if (!res.ok) throw new Error("trends fetch failed");
      const data = await res.json();
      const apiTrends = data.trends ?? [];
      const analyzed: any[] = data.analyzed ?? [];

      // Build a lookup map by keyword for correct matching
      const analysisMap = new Map<string, any>();
      for (const a of analyzed) {
        analysisMap.set(a.keyword, a);
      }

      const merged = apiTrends.map((t: any) => {
        const analysis = analysisMap.get(t.keyword);
        const revNum = analysis?.revenuePotential ?? 0;
        return {
          keyword: t.keyword,
          trendScore: t.trendScore,
          source: t.source,
          category: t.category ?? analysis?.suggestedCategory ?? "—",
          estimatedCPC: analysis?.estimatedCPC ?? 0,
          revenuePotential: (revNum >= 60 ? "high" : revNum >= 30 ? "medium" : "low") as "high" | "medium" | "low",
          keywordType: t.keywordType ?? (t.source === "evergreen" ? "evergreen" : "trending"),
          reason: t.reason ?? "",
        };
      });
      setTrends(merged);
      setLastFetched(new Date());
    } catch {
      setTrends([]);
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
    fetchTrends();
  }, [fetchSources, fetchTrends]);

  // ── Toggle status ──────────────────────────────────────────────────────────
  const toggleStatus = async (id: string) => {
    const source = sources.find((s) => s.id === id);
    if (!source) return;
    const newStatus = source.status === "active" ? "inactive" : "active";
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    try {
      const res = await fetch(`/api/crawl/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // revert
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: source.status } : s))
      );
      alert("상태 변경에 실패했습니다.");
    }
  };

  // ── Trigger crawl for one source ───────────────────────────────────────────
  const triggerCrawl = async (id: string) => {
    setCrawlingSourceId(id);
    try {
      const res = await fetch(`/api/crawl/sources/${id}`, { method: "POST" });
      if (!res.ok) throw new Error();
      alert("크롤링이 시작되었습니다.");
      await fetchSources();
    } catch {
      alert("크롤링 실행에 실패했습니다.");
    } finally {
      setCrawlingSourceId(null);
    }
  };

  // ── Delete source ──────────────────────────────────────────────────────────
  const deleteSource = async (id: string) => {
    if (!confirm("이 소스를 삭제하시겠습니까?")) return;
    setDeletingSourceId(id);
    try {
      const res = await fetch(`/api/crawl/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("삭제에 실패했습니다.");
    } finally {
      setDeletingSourceId(null);
    }
  };

  // ── Run all crawl ──────────────────────────────────────────────────────────
  const runAllCrawl = async () => {
    setRunAllCrawling(true);
    try {
      const res = await fetch("/api/crawl", { method: "POST" });
      if (!res.ok) throw new Error();
      alert("전체 크롤링이 시작되었습니다.");
      await fetchSources();
    } catch {
      alert("전체 크롤링 실행에 실패했습니다.");
    } finally {
      setRunAllCrawling(false);
    }
  };

  // ── Add source modal submit ────────────────────────────────────────────────
  const submitAddSource = async () => {
    if (!modalName.trim() || !modalUrl.trim()) {
      alert("소스명과 URL을 입력해주세요.");
      return;
    }
    setModalSubmitting(true);
    try {
      const res = await fetch("/api/crawl/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modalName, platform: modalPlatform, url: modalUrl }),
      });
      if (!res.ok) throw new Error();
      alert("소스가 추가되었습니다.");
      setShowModal(false);
      setModalName("");
      setModalPlatform("naver_blog");
      setModalUrl("");
      await fetchSources();
    } catch {
      alert("소스 추가에 실패했습니다.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // ── Map API response to PipelineResult ────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapPipelineResponse = (data: any): PipelineResult => ({
    executedAt: new Date().toLocaleString("ko-KR"),
    contentGenerated: data.generated ?? 0,
    errorCount: Array.isArray(data.errors) ? data.errors.length : 0,
    errorMessages: Array.isArray(data.errors) ? data.errors : [],
    items: Array.isArray(data.posts)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? data.posts.map((p: any) => ({
          title: p.title,
          keyword: p.keyword,
          success: true,
        }))
      : [],
  });

  // ── Pipeline: generate content for a keyword ───────────────────────────────
  const generateForKeyword = async (keyword: string) => {
    setPipelineRunning(true);
    setPipelineStep("trends");
    setPipelineKeyword(keyword);
    try {
      // Simulate step progression (actual work happens server-side)
      setTimeout(() => setPipelineStep("benchmark"), 2000);
      setTimeout(() => setPipelineStep("generate"), 6000);

      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "manual", keyword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPipelineStep("error");
        setPipelineResult({
          executedAt: new Date().toLocaleString("ko-KR"),
          contentGenerated: 0,
          errorCount: 1,
          errorMessages: [data.error ?? "API 오류"],
          items: [],
        });
        return;
      }

      setPipelineStep("done");
      setPipelineResult(mapPipelineResponse(data));
    } catch (err) {
      setPipelineStep("error");
      setPipelineResult({
        executedAt: new Date().toLocaleString("ko-KR"),
        contentGenerated: 0,
        errorCount: 1,
        errorMessages: [err instanceof Error ? err.message : "네트워크 오류"],
        items: [],
      });
    } finally {
      setPipelineRunning(false);
      setTimeout(() => { setPipelineStep("idle"); setPipelineKeyword(""); }, 3000);
    }
  };

  // ── Pipeline: auto mode ────────────────────────────────────────────────────
  const runAutoPipeline = async () => {
    setPipelineRunning(true);
    setPipelineStep("trends");
    setPipelineKeyword("");
    try {
      setTimeout(() => setPipelineStep("benchmark"), 3000);
      setTimeout(() => setPipelineStep("generate"), 8000);

      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "auto", count: 3 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPipelineStep("error");
        setPipelineResult({
          executedAt: new Date().toLocaleString("ko-KR"),
          contentGenerated: 0,
          errorCount: 1,
          errorMessages: [data.error ?? "API 오류"],
          items: [],
        });
        return;
      }

      setPipelineStep("done");
      setPipelineResult(mapPipelineResponse(data));
    } catch (err) {
      setPipelineStep("error");
      setPipelineResult({
        executedAt: new Date().toLocaleString("ko-KR"),
        contentGenerated: 0,
        errorCount: 1,
        errorMessages: [err instanceof Error ? err.message : "네트워크 오류"],
        items: [],
      });
    } finally {
      setPipelineRunning(false);
      setTimeout(() => { setPipelineStep("idle"); setPipelineKeyword(""); }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">크롤링 관리</h1>
          <p className="text-sm text-gray-500 mt-1">콘텐츠 소스를 관리하고 크롤링을 실행하세요.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          소스 추가
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500">전체 소스</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{sources.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500">활성 소스</p>
          <p className="text-2xl font-bold text-success mt-1">{sources.filter((s) => s.status === "active").length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500">총 수집 항목</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{sources.reduce((a, b) => a + b.itemCount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs text-gray-500">트렌딩 토픽</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">{trends.length}</p>
        </div>
      </div>

      {/* ── Pipeline Section ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            ⚡ AI 콘텐츠 자동 생성 파이프라인
          </h2>
        </div>

        {/* Workflow stepper - shows progress when running */}
        <div className="flex items-center gap-2 mb-5 px-3 py-3 rounded-lg bg-gray-50 border border-gray-100">
          {(["trends", "benchmark", "generate"] as const).map((stepKey, idx) => {
            const stepNum = idx + 1;
            const labels = ["트렌딩 키워드 발견", "인기 콘텐츠 벤치마킹", "AI 글 생성"];
            const stepOrder: PipelineStep[] = ["trends", "benchmark", "generate"];
            const currentIdx = stepOrder.indexOf(pipelineStep);
            const isActive = pipelineStep === stepKey;
            const isDone = pipelineStep === "done" || (currentIdx > idx && pipelineStep !== "idle" && pipelineStep !== "error");
            return (
              <React.Fragment key={stepKey}>
                {idx > 0 && (
                  <span className={cn("text-sm", isDone ? "text-primary-400" : "text-gray-300")}>→</span>
                )}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                    isDone ? "bg-green-500 text-white" :
                    isActive ? "bg-primary-600 text-white animate-pulse" :
                    "bg-primary-100 text-primary-700"
                  )}>
                    {isDone ? "✓" : stepNum}
                  </span>
                  <span className={cn(
                    "transition-colors",
                    isActive ? "text-primary-700 font-semibold" :
                    isDone ? "text-green-600" :
                    "text-gray-600"
                  )}>
                    {labels[idx]}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress indicator when running */}
        {pipelineRunning && pipelineStep !== "idle" && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-primary-50 border border-primary-100">
            <div className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
              <span className="text-sm font-medium text-primary-700">{STEP_LABELS[pipelineStep]}</span>
            </div>
            {pipelineKeyword && (
              <p className="text-xs text-primary-600 mt-1 ml-6">키워드: "{pipelineKeyword}"</p>
            )}
          </div>
        )}

        {/* Done/error indicator */}
        {!pipelineRunning && pipelineStep === "done" && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-100">
            <span className="text-sm font-medium text-green-700">파이프라인 완료!</span>
          </div>
        )}
        {!pipelineRunning && pipelineStep === "error" && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
            <span className="text-sm font-medium text-red-700">파이프라인 실행 중 오류가 발생했습니다.</span>
          </div>
        )}

        <p className="text-xs text-gray-500 mb-4">
          트렌딩 키워드를 자동으로 찾고, 해당 키워드의 인기 콘텐츠를 크롤링하여 벤치마킹한 후, AI가 더 나은 글을 생성합니다.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={runAutoPipeline}
            disabled={pipelineRunning}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
          >
            {pipelineRunning ? (
              <>
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                파이프라인 실행 중...
              </>
            ) : (
              <>⚡ 원클릭 자동 생성</>
            )}
          </button>
          <span className="text-xs text-gray-400">
            상위 3개 트렌딩 키워드로 자동 실행됩니다
          </span>
        </div>

        {pipelineResult ? (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
              <span>마지막 실행: <strong className="text-gray-800">{pipelineResult.executedAt}</strong></span>
              <span className="text-green-600">생성된 글: <strong>{pipelineResult.contentGenerated}개</strong></span>
              {pipelineResult.errorCount > 0 && (
                <span className="text-red-500">오류: <strong>{pipelineResult.errorCount}개</strong></span>
              )}
            </div>
            {pipelineResult.items.length > 0 && (
              <ul className="space-y-1.5">
                {pipelineResult.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span>✅</span>
                    <span className="text-gray-700">{item.title}</span>
                    <span className="text-xs text-gray-400 ml-auto">({item.keyword})</span>
                  </li>
                ))}
              </ul>
            )}
            {pipelineResult.errorMessages.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs font-medium text-red-600 mb-1">오류 상세:</p>
                <ul className="space-y-1">
                  {pipelineResult.errorMessages.map((msg, i) => (
                    <li key={i} className="text-xs text-red-500">❌ {msg}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : !pipelineRunning ? (
          <p className="text-xs text-gray-400">아직 실행 이력이 없습니다. 위 버튼을 눌러 자동 생성을 시작하세요.</p>
        ) : null}
      </div>

      {/* ── Keyword Discovery ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              🔥 키워드 발굴 (애드센스 최적화)
            </h2>
            {lastFetched && (
              <span className="text-xs text-gray-400">
                마지막 갱신: {lastFetched.toLocaleTimeString("ko-KR")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={fetchTrends}
              disabled={trendsLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50"
            >
              {trendsLoading ? (
                <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              키워드 갱신
            </button>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Google
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Naver
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Evergreen
              </span>
              {trends.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                  고수익 키워드 {trends.filter(t => t.revenuePotential === "high").length}개
                </span>
              )}
            </div>
          </div>
          {/* Keyword type tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
            {KEYWORD_TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setKeywordTypeFilter(tab.key)}
                title={tab.desc}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  keywordTypeFilter === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.label}
                <span className="ml-1 text-[10px] text-gray-400">
                  {tab.key === "all"
                    ? trends.length
                    : tab.key === "trending"
                    ? trends.filter(t => !t.keywordType || t.keywordType === "trending").length
                    : trends.filter(t => t.keywordType === tab.key).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {trendsLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : trends.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            키워드가 없습니다. 키워드 갱신 버튼을 눌러 분석하세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">키워드</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">유형</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">수요 점수</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">예상 CPC</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">수익 잠재력</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trends
                  .filter((t) => {
                    if (keywordTypeFilter === "all") return true;
                    if (keywordTypeFilter === "trending") return !t.keywordType || t.keywordType === "trending";
                    return t.keywordType === keywordTypeFilter;
                  })
                  .map((topic, idx) => {
                    const typeBadge = keywordTypeBadge[topic.keywordType ?? "trending"] ?? keywordTypeBadge.trending;
                    return (
                  <tr key={topic.keyword} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-6 py-3">
                      <div>
                        <span className="font-medium text-gray-900">{topic.keyword}</span>
                        {topic.reason && (
                          <p className="text-[11px] text-gray-400 mt-0.5 hidden group-hover:block">{topic.reason}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", typeBadge.color)}>
                        {typeBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-gray-600">{topic.category ?? "—"}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="flex items-center gap-1">
                        {trendIcon(topic.trendScore)}
                        <span className="font-semibold text-gray-700">{topic.trendScore}</span>
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">${topic.estimatedCPC?.toFixed(2) ?? "—"}</td>
                    <td className="px-6 py-3">
                      <span className={cn("font-mono text-sm", revenueColor[topic.revenuePotential])}>
                        {revenueBars[topic.revenuePotential]}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => generateForKeyword(topic.keyword)}
                        disabled={pipelineRunning}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50",
                          topic.revenuePotential === "high"
                            ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200"
                        )}
                      >
                        ✨ AI 생성
                      </button>
                    </td>
                  </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Sources Table ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">크롤링 소스 목록</h2>
          <button
            onClick={runAllCrawl}
            disabled={runAllCrawling}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors border border-primary-200 disabled:opacity-50"
          >
            {runAllCrawling ? (
              <span className="inline-block h-3 w-3 rounded-full border-2 border-primary-400 border-t-transparent animate-spin" />
            ) : (
              <span>🔄</span>
            )}
            전체 크롤링 실행
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            등록된 소스가 없습니다. 소스를 추가하세요.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">소스명</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">플랫폼</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">URL</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">마지막 크롤링</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">수집 수</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{source.name}</td>
                    <td className="px-6 py-4">
                      <span className={cn("text-xs font-medium px-2 py-1 rounded-full", platformBadge[source.platform] ?? "bg-gray-100 text-gray-600")}>
                        {PLATFORM_LABEL[source.platform] ?? source.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs truncate max-w-[200px] block">
                        {source.url}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(source.id)}
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                          source.status === "active" ? "bg-primary-600" : "bg-gray-300"
                        )}
                        title={source.status === "active" ? "비활성화" : "활성화"}
                      >
                        <span
                          className={cn(
                            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                            source.status === "active" ? "translate-x-4" : "translate-x-0.5"
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs hidden md:table-cell">{source.lastCrawled || "—"}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium hidden sm:table-cell">{source.itemCount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => triggerCrawl(source.id)}
                          disabled={crawlingSourceId === source.id}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium disabled:opacity-50"
                        >
                          {crawlingSourceId === source.id ? "실행중..." : "크롤링"}
                        </button>
                        <button className="text-xs text-gray-500 hover:text-gray-700 font-medium">수정</button>
                        <button
                          onClick={() => deleteSource(source.id)}
                          disabled={deletingSourceId === source.id}
                          className="text-xs text-error hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {deletingSourceId === source.id ? "삭제중..." : "삭제"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Source Modal ───────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">소스 추가</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소스명</label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="예: 네이버 개발 블로그"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼</label>
                <select
                  value={modalPlatform}
                  onChange={(e) => setModalPlatform(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  type="url"
                  value={modalUrl}
                  onChange={(e) => setModalUrl(e.target.value)}
                  placeholder="https://"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setModalName("");
                  setModalPlatform("naver_blog");
                  setModalUrl("");
                }}
                disabled={modalSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={submitAddSource}
                disabled={modalSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                {modalSubmitting && (
                  <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
