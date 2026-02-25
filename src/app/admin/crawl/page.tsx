"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils/cn";

// ── Shared Interfaces ────────────────────────────────────────────────────────

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
  "네이버 블로그": "bg-green-100 text-green-700",
  "유튜브 채널": "bg-red-100 text-red-700",
  "티스토리": "bg-orange-100 text-orange-700",
  "외부 블로그": "bg-gray-100 text-gray-600",
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

// ── Manual generation interfaces ─────────────────────────────────────────────

interface ManualCrawlSource {
  id: string;
  name: string;
  platform: string;
  itemCount: number;
}

interface CrawledItem {
  id: string;
  title: string;
  original_url: string;
  original_content?: string;
  source_id: string;
  is_used: boolean;
  crawled_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const aiProviders = [
  { id: "openai", name: "OpenAI GPT-4o", color: "#10A37F", bgColor: "bg-emerald-50", borderColor: "border-emerald-300", textColor: "text-emerald-700", badge: "GPT" },
  { id: "claude", name: "Anthropic Claude", color: "#D97706", bgColor: "bg-amber-50", borderColor: "border-amber-300", textColor: "text-amber-700", badge: "Claude" },
  { id: "gemini", name: "Google Gemini", color: "#4285F4", bgColor: "bg-blue-50", borderColor: "border-blue-300", textColor: "text-blue-700", badge: "Gemini" },
  { id: "moonshot", name: "Moonshot AI (Kimi)", color: "#6366F1", bgColor: "bg-indigo-50", borderColor: "border-indigo-300", textColor: "text-indigo-700", badge: "Kimi" },
];

const fallbackCategories = ["기술/IT", "프로그래밍", "AI/머신러닝", "웹개발", "모바일", "데이터사이언스", "기타"];
const tones = [
  { id: "professional", label: "전문적" },
  { id: "casual", label: "친근한" },
  { id: "educational", label: "교육적" },
  { id: "informative", label: "정보성" },
];

const providerModelMap: Record<string, string> = {
  openai: "gpt-4o",
  claude: "claude-3-5-sonnet-20241022",
  gemini: "gemini-1.5-pro",
  moonshot: "moonshot-v1-128k",
};

// ── Top-level tabs ───────────────────────────────────────────────────────────

type TopTab = "pipeline" | "manual" | "sources";
const TOP_TABS: { key: TopTab; label: string }[] = [
  { key: "pipeline", label: "파이프라인" },
  { key: "manual", label: "수동 생성" },
  { key: "sources", label: "소스 관리" },
];

// ═════════════════════════════════════════════════════════════════════════════
// Page Component
// ═════════════════════════════════════════════════════════════════════════════

export default function CrawlPage() {
  const [activeTab, setActiveTab] = useState<TopTab>("pipeline");

  // ── Crawl / Pipeline state ───────────────────────────────────────────────
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
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalPlatform, setModalPlatform] = useState("naver_blog");
  const [modalUrl, setModalUrl] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [runAllCrawling, setRunAllCrawling] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [keywordTypeFilter, setKeywordTypeFilter] = useState<KeywordTypeFilter>("all");
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentKeyword: "" });
  const [genTone, setGenTone] = useState<string>("casual");
  const [genWordCount, setGenWordCount] = useState<number>(2500);
  const [genPersona, setGenPersona] = useState<string>("");
  const [genCategoryStyle, setGenCategoryStyle] = useState<string>("");
  const [showGenOptions, setShowGenOptions] = useState(false);

  // ── Timer ref for pipeline step timeouts ─────────────────────────────────
  const stepTimersRef = useRef<NodeJS.Timeout[]>([]);
  const clearStepTimers = useCallback(() => {
    stepTimersRef.current.forEach(clearTimeout);
    stepTimersRef.current = [];
  }, []);

  // cleanup on unmount
  useEffect(() => {
    const ref = stepTimersRef;
    return () => {
      ref.current.forEach(clearTimeout);
    };
  }, []);

  // ── Manual generation state ──────────────────────────────────────────────
  const [manualStep, setManualStep] = useState(1);
  const [inputMethod, setInputMethod] = useState<"topic" | "trend" | "source">("topic");
  const [selectedSource, setSelectedSource] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("moonshot");
  const [selectedCategory, setSelectedCategory] = useState("기술/IT");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [wordCount, setWordCount] = useState(2000);
  const [seoKeywords, setSeoKeywords] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generateError, setGenerateError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedPostId, setSavedPostId] = useState<string | null>(null);
  const [manualCrawlSources, setManualCrawlSources] = useState<ManualCrawlSource[]>([]);
  const [crawledItems, setCrawledItems] = useState<CrawledItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [sourceItems, setSourceItems] = useState<CrawledItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [manualTrends, setManualTrends] = useState<{ keyword: string; trendScore: number; source?: string; category?: string }[]>([]);
  const [manualTrendsLoading, setManualTrendsLoading] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState("");

  // ── Fetch sources ────────────────────────────────────────────────────────
  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/crawl/sources");
      if (!res.ok) throw new Error("sources fetch failed");
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (data.sources ?? data ?? []).map((s: any) => ({
        ...s,
        status: s.status ?? (s.is_active ? "active" : "inactive"),
        lastCrawled: s.lastCrawled ?? s.last_crawled_at ?? "",
        itemCount: s.itemCount ?? s.total_items ?? 0,
      }));
      setSources(mapped);
    } catch {
      setSources(MOCK_SOURCES);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch trends ─────────────────────────────────────────────────────────
  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const res = await fetch("/api/crawl/trends?analyze=true");
      if (!res.ok) throw new Error("trends fetch failed");
      const data = await res.json();
      const apiTrends = data.trends ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const analyzed: any[] = data.analyzed ?? [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const analysisMap = new Map<string, any>();
      for (const a of analyzed) {
        analysisMap.set(a.keyword, a);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // ── Fetch data for manual generation tab ─────────────────────────────────
  useEffect(() => {
    fetch("/api/crawl/sources")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setManualCrawlSources(data.sources ?? data ?? []))
      .catch(() => setManualCrawlSources([]));

    fetch("/api/categories")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setCategories(data.categories ?? data ?? []))
      .catch(() => setCategories([]));

    fetch("/api/crawl/items?is_used=false&limit=50")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setCrawledItems(data.items ?? []))
      .catch(() => setCrawledItems([]));

    setManualTrendsLoading(true);
    fetch("/api/crawl/trends?limit=10")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setManualTrends(data.trends ?? []))
      .catch(() => setManualTrends([]))
      .finally(() => setManualTrendsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSourceId) {
      setSourceItems(crawledItems.filter(item => item.source_id === selectedSourceId));
    } else {
      setSourceItems(crawledItems);
    }
    setSelectedItemId("");
  }, [selectedSourceId, crawledItems]);

  // ── Toggle status ────────────────────────────────────────────────────────
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
        body: JSON.stringify({ is_active: newStatus === "active" }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: source.status } : s))
      );
      alert("상태 변경에 실패했습니다.");
    }
  };

  // ── Trigger crawl for one source ─────────────────────────────────────────
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

  // ── Delete source ────────────────────────────────────────────────────────
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

  // ── Run all crawl ────────────────────────────────────────────────────────
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

  // ── Add source modal submit ──────────────────────────────────────────────
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

  // ── Open modal for editing an existing source ─────────────────────────
  const openEditModal = (source: CrawlSource) => {
    setEditingSourceId(source.id);
    setModalName(source.name);
    setModalPlatform(source.platform);
    setModalUrl(source.url);
    setShowModal(true);
  };

  const submitEditSource = async () => {
    if (!editingSourceId || !modalName.trim() || !modalUrl.trim()) {
      alert("소스명과 URL을 입력해주세요.");
      return;
    }
    setModalSubmitting(true);
    try {
      const res = await fetch(`/api/crawl/sources/${editingSourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: modalName, platform: modalPlatform, url: modalUrl }),
      });
      if (!res.ok) throw new Error();
      alert("소스가 수정되었습니다.");
      setShowModal(false);
      setEditingSourceId(null);
      setModalName("");
      setModalPlatform("naver_blog");
      setModalUrl("");
      await fetchSources();
    } catch {
      alert("소스 수정에 실패했습니다.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // ── Map API response to PipelineResult ──────────────────────────────────
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

  // ── Pipeline: generate content for a keyword ─────────────────────────────
  const generateForKeyword = async (keyword: string) => {
    clearStepTimers();
    setPipelineRunning(true);
    setPipelineStep("trends");
    setPipelineKeyword(keyword);
    try {
      stepTimersRef.current.push(setTimeout(() => setPipelineStep("benchmark"), 2000));
      stepTimersRef.current.push(setTimeout(() => setPipelineStep("generate"), 6000));

      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          keyword,
          tone: genTone || undefined,
          wordCount: genWordCount,
          persona: genPersona || undefined,
          categoryStyle: genCategoryStyle || undefined,
        }),
      });

      const data = await res.json();
      clearStepTimers();

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
      clearStepTimers();
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
      const t = setTimeout(() => { setPipelineStep("idle"); setPipelineKeyword(""); }, 3000);
      stepTimersRef.current.push(t);
    }
  };

  // ── Keyword selection helpers ────────────────────────────────────────────
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      return next;
    });
  };

  const filteredTrends = trends.filter((t) => {
    if (keywordTypeFilter === "all") return true;
    if (keywordTypeFilter === "trending") return !t.keywordType || t.keywordType === "trending";
    return t.keywordType === keywordTypeFilter;
  });

  const toggleAllFiltered = () => {
    const allFilteredKeywords = filteredTrends.map((t) => t.keyword);
    const allSelected = allFilteredKeywords.every((k) => selectedKeywords.has(k));
    if (allSelected) {
      setSelectedKeywords((prev) => {
        const next = new Set(prev);
        allFilteredKeywords.forEach((k) => next.delete(k));
        return next;
      });
    } else {
      setSelectedKeywords((prev) => {
        const next = new Set(prev);
        allFilteredKeywords.forEach((k) => next.add(k));
        return next;
      });
    }
  };

  // ── Pipeline: batch generate for selected keywords ───────────────────────
  const runBatchForSelected = async () => {
    const keywords = Array.from(selectedKeywords);
    if (keywords.length === 0) { alert("키워드를 선택해주세요."); return; }
    if (!confirm(`선택한 ${keywords.length}개 키워드로 글을 생성하시겠습니까?`)) return;

    setBatchGenerating(true);
    setBatchProgress({ current: 0, total: keywords.length, currentKeyword: "" });
    setPipelineStep("generate");

    const allItems: { title: string; keyword: string; success: boolean }[] = [];
    const allErrors: string[] = [];

    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      setBatchProgress({ current: i + 1, total: keywords.length, currentKeyword: kw });

      try {
        const res = await fetch("/api/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "manual",
            keyword: kw,
            tone: genTone || undefined,
            wordCount: genWordCount,
            persona: genPersona || undefined,
            categoryStyle: genCategoryStyle || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          allErrors.push(`"${kw}": ${data.error ?? "API 오류"}`);
          allItems.push({ title: kw, keyword: kw, success: false });
        } else {
          const posts = data.posts ?? [];
          for (const p of posts) {
            allItems.push({ title: p.title, keyword: p.keyword, success: true });
          }
        }
      } catch (err) {
        allErrors.push(`"${kw}": ${err instanceof Error ? err.message : "네트워크 오류"}`);
        allItems.push({ title: kw, keyword: kw, success: false });
      }
    }

    setPipelineStep("done");
    setPipelineResult({
      executedAt: new Date().toLocaleString("ko-KR"),
      contentGenerated: allItems.filter((i) => i.success).length,
      errorCount: allErrors.length,
      errorMessages: allErrors,
      items: allItems,
    });
    setSelectedKeywords(new Set());
    setBatchGenerating(false);
    const t = setTimeout(() => { setPipelineStep("idle"); }, 3000);
    stepTimersRef.current.push(t);
  };

  // ── Pipeline: auto mode ──────────────────────────────────────────────────
  const runAutoPipeline = async () => {
    clearStepTimers();
    setPipelineRunning(true);
    setPipelineStep("trends");
    setPipelineKeyword("");
    try {
      stepTimersRef.current.push(setTimeout(() => setPipelineStep("benchmark"), 3000));
      stepTimersRef.current.push(setTimeout(() => setPipelineStep("generate"), 8000));

      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "auto",
          count: 3,
          tone: genTone || undefined,
          wordCount: genWordCount,
          persona: genPersona || undefined,
          categoryStyle: genCategoryStyle || undefined,
        }),
      });

      const data = await res.json();
      clearStepTimers();

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
      clearStepTimers();
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
      const t = setTimeout(() => { setPipelineStep("idle"); setPipelineKeyword(""); }, 3000);
      stepTimersRef.current.push(t);
    }
  };

  // ── Manual generation handlers ───────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedContent("");
    setGenerateError("");
    setSaveSuccess(false);
    setSavedPostId(null);

    try {
      const selectedItem = crawledItems.find(i => i.id === selectedItemId);
      const sourceContent = selectedItem?.original_content;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          model: providerModelMap[selectedProvider],
          topic: inputMethod === "topic" ? topic : inputMethod === "trend" ? selectedTrend : selectedSource,
          category: selectedCategory,
          tone: selectedTone,
          wordCount,
          seoKeywords: seoKeywords || undefined,
          sourceContent: sourceContent || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenerateError(data.error || "글 생성에 실패했습니다.");
        return;
      }

      setGeneratedContent(data.data.content);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const extractTitleFromContent = (content: string): string => {
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) return h1Match[1].trim();
    const h2Match = content.match(/^##\s+(.+)$/m);
    if (h2Match) return h2Match[1].trim();
    const firstLine = content.split('\n')[0].trim();
    return firstLine.substring(0, 100) || "제목 없음";
  };

  const extractExcerptFromContent = (content: string): string => {
    const withoutHeadings = content.replace(/^#+\s+.+$/gm, '').trim();
    const firstPara = withoutHeadings.split('\n\n')[0].trim();
    return firstPara.substring(0, 200) + (firstPara.length > 200 ? '...' : '');
  };

  const handleSave = async () => {
    if (!generatedContent) return;

    setSaving(true);
    setGenerateError("");

    try {
      const title = extractTitleFromContent(generatedContent);
      const excerpt = extractExcerptFromContent(generatedContent);
      const slug = title
        .toLowerCase()
        .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);

      const category = categories.find(c => c.name === selectedCategory);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content: generatedContent,
          excerpt,
          status: 'draft',
          ai_provider: selectedProvider,
          ai_model: providerModelMap[selectedProvider],
          seo_keywords: seoKeywords || null,
          category_id: category?.id || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenerateError(data.error || "포스트 저장에 실패했습니다.");
        return;
      }

      setSaveSuccess(true);
      setSavedPostId(data.post.id);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 생성</h1>
        <p className="text-sm text-gray-500 mt-1">AI 파이프라인으로 콘텐츠를 자동 생성하거나, 수동으로 글을 작성하세요.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {TOP_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Pipeline ───────────────────────────────────────────────────── */}
      {activeTab === "pipeline" && (
        <>
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

          {/* Pipeline Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                AI 콘텐츠 자동 생성 파이프라인
              </h2>
            </div>

            {/* Workflow stepper */}
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
                  <p className="text-xs text-primary-600 mt-1 ml-6">키워드: &quot;{pipelineKeyword}&quot;</p>
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

            {/* Generation Options Panel */}
            <div className="mb-4">
              <button
                onClick={() => setShowGenOptions(!showGenOptions)}
                className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors mb-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={cn("w-4 h-4 transition-transform", showGenOptions && "rotate-90")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                생성 옵션
              </button>

              {showGenOptions && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">글 톤</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { value: "professional", label: "전문적" },
                        { value: "casual", label: "친근한" },
                        { value: "educational", label: "교육적" },
                        { value: "informative", label: "정보전달" },
                      ].map((tone) => (
                        <button
                          key={tone.value}
                          onClick={() => setGenTone(tone.value)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-full transition-all border",
                            genTone === tone.value
                              ? "bg-primary-600 text-white border-primary-600"
                              : "bg-white text-gray-600 border-gray-300 hover:border-primary-400"
                          )}
                        >
                          {tone.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      글 길이 <span className="text-primary-600 font-semibold">{genWordCount}자</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1000"
                        max="5000"
                        step="500"
                        value={genWordCount}
                        onChange={(e) => setGenWordCount(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                      />
                      <div className="flex items-center gap-1.5">
                        {[
                          { value: 1500, label: "짧게" },
                          { value: 2500, label: "보통" },
                          { value: 4000, label: "길게" },
                        ].map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => setGenWordCount(preset.value)}
                            className={cn(
                              "px-2 py-1 text-[10px] font-medium rounded transition-colors",
                              genWordCount === preset.value
                                ? "bg-primary-600 text-white"
                                : "bg-white text-gray-500 hover:text-gray-700 border border-gray-300"
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">카테고리 스타일</label>
                    <select
                      value={genCategoryStyle}
                      onChange={(e) => setGenCategoryStyle(e.target.value)}
                      className="w-full max-w-xs px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">자동 감지</option>
                      <option value="금융">금융</option>
                      <option value="건강">건강</option>
                      <option value="부동산">부동산</option>
                      <option value="정부지원">정부지원</option>
                      <option value="IT/기술">IT/기술</option>
                      <option value="생활정보">생활정보</option>
                      <option value="교육">교육</option>
                      <option value="여행">여행</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">페르소나</label>
                    <input
                      type="text"
                      value={genPersona}
                      onChange={(e) => setGenPersona(e.target.value)}
                      placeholder="비워두면 자동 로테이션됩니다"
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Batch progress indicator */}
            {batchGenerating && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span className="text-sm font-medium text-indigo-700">
                    선택 키워드 생성 중... ({batchProgress.current}/{batchProgress.total})
                  </span>
                </div>
                <div className="w-full bg-indigo-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }}
                  />
                </div>
                {batchProgress.currentKeyword && (
                  <p className="text-xs text-indigo-600 mt-1">현재: &quot;{batchProgress.currentKeyword}&quot;</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <button
                onClick={runAutoPipeline}
                disabled={pipelineRunning || batchGenerating}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                {pipelineRunning && !batchGenerating ? (
                  <>
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    파이프라인 실행 중...
                  </>
                ) : (
                  <>원클릭 자동 생성</>
                )}
              </button>
              {selectedKeywords.size > 0 && (
                <button
                  onClick={runBatchForSelected}
                  disabled={pipelineRunning || batchGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {batchGenerating ? (
                    <>
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>선택한 {selectedKeywords.size}개 키워드로 생성</>
                  )}
                </button>
              )}
              <span className="text-xs text-gray-400">
                {selectedKeywords.size > 0
                  ? `${selectedKeywords.size}개 선택됨 — 아래 키워드 목록에서 선택/해제하세요`
                  : "아래 키워드 목록에서 선택하거나, 자동 생성을 사용하세요"}
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
                        <span>{item.success ? "✅" : "❌"}</span>
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
                        <li key={i} className="text-xs text-red-500">- {msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : !pipelineRunning ? (
              <p className="text-xs text-gray-400">아직 실행 이력이 없습니다. 위 버튼을 눌러 자동 생성을 시작하세요.</p>
            ) : null}
          </div>

          {/* ── Trends section (integrated into pipeline tab) ──────────────── */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  키워드 발굴 (애드센스 최적화)
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
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={filteredTrends.length > 0 && filteredTrends.every((t) => selectedKeywords.has(t.keyword))}
                          onChange={toggleAllFiltered}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="전체 선택/해제"
                        />
                      </th>
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
                    {filteredTrends.map((topic, idx) => {
                      const typeBadge = keywordTypeBadge[topic.keywordType ?? "trending"] ?? keywordTypeBadge.trending;
                      const isSelected = selectedKeywords.has(topic.keyword);
                      return (
                        <tr
                          key={topic.keyword}
                          className={cn(
                            "hover:bg-gray-50 transition-colors group cursor-pointer",
                            isSelected && "bg-indigo-50/50"
                          )}
                          onClick={() => toggleKeyword(topic.keyword)}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleKeyword(topic.keyword)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
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
                              onClick={(e) => { e.stopPropagation(); generateForKeyword(topic.keyword); }}
                              disabled={pipelineRunning}
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50",
                                topic.revenuePotential === "high"
                                  ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200"
                              )}
                            >
                              AI 생성
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
        </>
      )}

      {/* ── Tab: Manual Generation ──────────────────────────────────────────── */}
      {activeTab === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left panel: 3-step form (60%) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-0">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <button
                    onClick={() => setManualStep(s)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      manualStep === s
                        ? "bg-primary-600 text-white"
                        : manualStep > s
                        ? "bg-primary-50 text-primary-600"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                      manualStep === s ? "bg-white text-primary-600" : manualStep > s ? "bg-primary-600 text-white" : "bg-gray-400 text-white"
                    )}>
                      {manualStep > s ? "✓" : s}
                    </span>
                    <span className="hidden sm:inline">
                      {s === 1 ? "소스 선택" : s === 2 ? "AI 제공사" : "옵션 설정"}
                    </span>
                  </button>
                  {s < 3 && <div className={cn("flex-1 h-0.5 mx-1", manualStep > s ? "bg-primary-300" : "bg-gray-200")} />}
                </React.Fragment>
              ))}
            </div>

            {/* Step 1: Source selection */}
            {manualStep === 1 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-semibold text-gray-800">소스 선택</h2>

                <div className="flex gap-2">
                  {(
                    [
                      { key: "topic", label: "직접 주제 입력" },
                      { key: "trend", label: "트렌딩 토픽" },
                      { key: "source", label: "크롤링 소스" },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setInputMethod(tab.key)}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium rounded-md border transition-colors",
                        inputMethod === tab.key
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {inputMethod === "topic" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">주제 직접 입력</label>
                    <textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="예: Next.js 15와 React 19의 새로운 기능을 비교 분석하는 글을 작성해주세요."
                      rows={4}
                      className="w-full px-3 py-2.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">{topic.length} / 500자</p>
                  </div>
                )}

                {inputMethod === "trend" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">트렌딩 토픽 선택</label>
                    {manualTrendsLoading ? (
                      <div className="py-6 text-center text-sm text-gray-400">트렌딩 토픽 로딩 중...</div>
                    ) : manualTrends.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-400">트렌딩 토픽을 불러올 수 없습니다.</div>
                    ) : (
                      <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                        {manualTrends.map((t) => (
                          <button
                            key={t.keyword}
                            onClick={() => {
                              setSelectedTrend(t.keyword);
                              setSelectedSource(t.keyword);
                              setTopic(t.keyword);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-colors",
                              selectedTrend === t.keyword
                                ? "border-primary-500 bg-primary-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium truncate", selectedTrend === t.keyword ? "text-primary-700" : "text-gray-800")}>
                                {t.keyword}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {t.source && (
                                  <span className={cn(
                                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                    t.source === "google" ? "bg-blue-100 text-blue-600" :
                                    t.source === "naver" ? "bg-green-100 text-green-600" :
                                    "bg-yellow-100 text-yellow-600"
                                  )}>
                                    {t.source === "google" ? "Google" : t.source === "naver" ? "Naver" : "Daum"}
                                  </span>
                                )}
                                {t.category && (
                                  <span className="text-[10px] text-gray-400">{t.category}</span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-gray-500 shrink-0">{t.trendScore}점</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {inputMethod === "source" && (
                  crawledItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                      <p className="text-sm text-gray-500">아직 크롤링된 데이터가 없습니다.</p>
                      <p className="text-xs text-gray-400 mt-1 mb-3">소스 관리 탭에서 소스를 추가하고 크롤링을 실행하세요.</p>
                      <button
                        onClick={() => setActiveTab("sources")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                      >
                        소스 관리로 이동
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">소스 필터</label>
                        <select
                          value={selectedSourceId}
                          onChange={(e) => setSelectedSourceId(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">전체 소스</option>
                          {manualCrawlSources.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.itemCount}건)</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">크롤링 아이템 선택</label>
                        <select
                          value={selectedItemId}
                          onChange={(e) => {
                            setSelectedItemId(e.target.value);
                            const item = crawledItems.find(i => i.id === e.target.value);
                            if (item) setSelectedSource(item.title);
                          }}
                          className="w-full px-3 py-2.5 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">아이템을 선택하세요</option>
                          {sourceItems.map((item) => (
                            <option key={item.id} value={item.id}>{item.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )
                )}

                <button
                  onClick={() => setManualStep(2)}
                  disabled={
                    inputMethod === "topic" ? !topic.trim() :
                    inputMethod === "trend" ? !selectedTrend :
                    !selectedItemId && !selectedSource
                  }
                  className="w-full py-2.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음 단계
                </button>
              </div>
            )}

            {/* Step 2: AI provider */}
            {manualStep === 2 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-semibold text-gray-800">AI 제공사 선택</h2>
                <div className="grid grid-cols-1 gap-3">
                  {aiProviders.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProvider(p.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                        selectedProvider === p.id
                          ? `${p.bgColor} ${p.borderColor}`
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: p.color }}>
                        {p.badge[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-semibold text-sm", selectedProvider === p.id ? p.textColor : "text-gray-800")}>{p.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.id === "openai" ? "최고의 창의성과 다양한 스타일" : p.id === "claude" ? "정확한 분석과 체계적인 구성" : p.id === "gemini" ? "방대한 지식과 최신 정보 반영" : "한국어 특화 콘텐츠 생성"}
                        </p>
                      </div>
                      {selectedProvider === p.id && (
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", p.bgColor)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={cn("w-3 h-3", p.textColor)} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setManualStep(1)} className="flex-1 py-2.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                    이전
                  </button>
                  <button onClick={() => setManualStep(3)} className="flex-1 py-2.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                    다음 단계
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Options */}
            {manualStep === 3 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
                <h2 className="text-base font-semibold text-gray-800">옵션 설정</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">카테고리</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)
                    ) : (
                      fallbackCategories.map((c) => <option key={c}>{c}</option>)
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">글 톤</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tones.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTone(t.id)}
                        className={cn(
                          "py-2 text-sm font-medium rounded-md border transition-colors",
                          selectedTone === t.id
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    목표 글자 수: <span className="text-primary-600 font-semibold">{wordCount.toLocaleString()}자</span>
                  </label>
                  <input
                    type="range"
                    min={500}
                    max={5000}
                    step={100}
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>500자</span>
                    <span>5,000자</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO 키워드</label>
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="예: Next.js, React, 웹개발 (쉼표로 구분)"
                    className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setManualStep(2)} className="flex-1 py-2.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                    이전
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        생성 중...
                      </>
                    ) : (
                      "글 생성하기"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Preview (40%) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">미리보기</h3>
              {generateError && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {generateError}
                </div>
              )}
              {saveSuccess && savedPostId && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm space-y-2">
                  <p className="font-medium">저장 완료!</p>
                  <div className="flex gap-2">
                    <a
                      href={`/admin/posts/${savedPostId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      편집하기
                    </a>
                    <button
                      onClick={() => {
                        setGeneratedContent("");
                        setSaveSuccess(false);
                        setSavedPostId(null);
                        setManualStep(1);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
                    >
                      새 글 생성
                    </button>
                  </div>
                </div>
              )}
              {generatedContent ? (
                <>
                  <div className="bg-gray-50 rounded-md border border-gray-200 p-4 max-h-[500px] overflow-y-auto mb-3">
                    <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                      {generatedContent}
                    </div>
                  </div>
                  {!saveSuccess && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full py-2.5 text-sm font-semibold rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          저장 중...
                        </>
                      ) : (
                        "저장하기"
                      )}
                    </button>
                  )}
                </>
              ) : generating ? (
                <div className="bg-gray-50 rounded-md border border-dashed border-gray-300 min-h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <svg className="animate-spin w-8 h-8 text-primary-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-gray-500">AI가 글을 생성하고 있습니다...</p>
                    <p className="text-xs text-gray-400 mt-1">잠시만 기다려주세요</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-md border border-dashed border-gray-300 min-h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mt-2">글이 생성되면 여기에 표시됩니다</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Sources ────────────────────────────────────────────────────── */}
      {activeTab === "sources" && (
        <>
          <div className="flex items-center justify-end">
            <button
              onClick={() => { setEditingSourceId(null); setModalName(""); setModalPlatform("naver_blog"); setModalUrl(""); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              소스 추가
            </button>
          </div>

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
                  <span>전체 크롤링 실행</span>
                )}
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
                        <td className="px-6 py-4 text-gray-700 font-medium hidden sm:table-cell">{(source.itemCount ?? 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => triggerCrawl(source.id)}
                              disabled={crawlingSourceId === source.id}
                              className="text-xs text-primary-600 hover:text-primary-800 font-medium disabled:opacity-50"
                            >
                              {crawlingSourceId === source.id ? "실행중..." : "크롤링"}
                            </button>
                            <button onClick={() => openEditModal(source)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">수정</button>
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
        </>
      )}

      {/* ── Add Source Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{editingSourceId ? "소스 수정" : "소스 추가"}</h2>
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
                  setEditingSourceId(null);
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
                onClick={editingSourceId ? submitEditSource : submitAddSource}
                disabled={modalSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                {modalSubmitting && (
                  <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                {editingSourceId ? "수정하기" : "추가하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
