"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface CrawlSource {
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

interface TrendTopic {
  keyword: string;
  trendScore: number;
  source?: string;
  category?: string;
}

export default function GeneratePage() {
  const [step, setStep] = useState(1);
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

  const [crawlSources, setCrawlSources] = useState<CrawlSource[]>([]);
  const [crawledItems, setCrawledItems] = useState<CrawledItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [sourceItems, setSourceItems] = useState<CrawledItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState("");

  useEffect(() => {
    fetch("/api/crawl/sources")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setCrawlSources(data.sources ?? data ?? []))
      .catch(() => setCrawlSources([]));

    fetch("/api/categories")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setCategories(data.categories ?? data ?? []))
      .catch(() => setCategories([]));

    fetch("/api/crawl/items?is_used=false&limit=50")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setCrawledItems(data.items ?? []))
      .catch(() => setCrawledItems([]));

    // Fetch trending topics
    setTrendsLoading(true);
    fetch("/api/crawl/trends?limit=10")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setTrends(data.trends ?? []))
      .catch(() => setTrends([]))
      .finally(() => setTrendsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSourceId) {
      setSourceItems(crawledItems.filter(item => item.source_id === selectedSourceId));
    } else {
      setSourceItems(crawledItems);
    }
    setSelectedItemId("");
  }, [selectedSourceId, crawledItems]);

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
    // Try to find the first markdown heading (# or ##)
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) return h1Match[1].trim();

    const h2Match = content.match(/^##\s+(.+)$/m);
    if (h2Match) return h2Match[1].trim();

    // Fallback: use first line or truncated content
    const firstLine = content.split('\n')[0].trim();
    return firstLine.substring(0, 100) || "제목 없음";
  };

  const extractExcerptFromContent = (content: string): string => {
    // Remove markdown headings
    const withoutHeadings = content.replace(/^#+\s+.+$/gm, '').trim();
    // Get first paragraph
    const firstPara = withoutHeadings.split('\n\n')[0].trim();
    // Limit to 200 characters
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

      // Find category_id if we have categories loaded
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI 글 생성</h1>
        <p className="text-sm text-gray-500 mt-1">AI를 활용하여 고품질 블로그 글을 자동으로 생성하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left panel: 3-step form (60%) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Step indicator */}
          <div className="flex items-center gap-0">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <button
                  onClick={() => setStep(s)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    step === s
                      ? "bg-primary-600 text-white"
                      : step > s
                      ? "bg-primary-50 text-primary-600"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                    step === s ? "bg-white text-primary-600" : step > s ? "bg-primary-600 text-white" : "bg-gray-400 text-white"
                  )}>
                    {step > s ? "✓" : s}
                  </span>
                  <span className="hidden sm:inline">
                    {s === 1 ? "소스 선택" : s === 2 ? "AI 제공사" : "옵션 설정"}
                  </span>
                </button>
                {s < 3 && <div className={cn("flex-1 h-0.5 mx-1", step > s ? "bg-primary-300" : "bg-gray-200")} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Source selection */}
          {step === 1 && (
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
                  {trendsLoading ? (
                    <div className="py-6 text-center text-sm text-gray-400">트렌딩 토픽 로딩 중...</div>
                  ) : trends.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-400">트렌딩 토픽을 불러올 수 없습니다.</div>
                  ) : (
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                      {trends.map((t) => (
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
                    <p className="text-xs text-gray-400 mt-1 mb-3">크롤링 관리 페이지에서 소스를 추가하고 크롤링을 실행하세요.</p>
                    <a
                      href="/admin/crawl"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                    >
                      크롤링 관리로 이동
                    </a>
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
                        {crawlSources.map((s) => (
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
                onClick={() => setStep(2)}
                disabled={
                  inputMethod === "topic" ? !topic.trim() :
                  inputMethod === "trend" ? !selectedTrend :
                  !selectedItemId && !selectedSource
                }
                className="w-full py-2.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음 단계 →
              </button>
            </div>
          )}

          {/* Step 2: AI provider */}
          {step === 2 && (
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
                <button onClick={() => setStep(1)} className="flex-1 py-2.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                  ← 이전
                </button>
                <button onClick={() => setStep(3)} className="flex-1 py-2.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors">
                  다음 단계 →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Options */}
          {step === 3 && (
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
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
                  ← 이전
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
                    <><span>✨</span> 글 생성하기</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right panel: Preview (40%) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Preview area */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">미리보기</h3>
            {generateError && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {generateError}
              </div>
            )}
            {saveSuccess && savedPostId && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm space-y-2">
                <p className="font-medium">✓ 저장 완료!</p>
                <div className="flex gap-2">
                  <a
                    href={`/admin/posts/${savedPostId}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    편집하기 →
                  </a>
                  <button
                    onClick={() => {
                      setGeneratedContent("");
                      setSaveSuccess(false);
                      setSavedPostId(null);
                      setStep(1);
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
                      <><span>💾</span> 저장하기</>
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
                  <span className="text-3xl">✨</span>
                  <p className="text-sm text-gray-400 mt-2">글이 생성되면 여기에 표시됩니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
