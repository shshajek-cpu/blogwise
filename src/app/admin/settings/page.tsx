"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

function SectionCard({ title, description, children, onSave, saving, saveError, saveSuccess }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => void;
  saving?: boolean;
  saveError?: string;
  saveSuccess?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-4">
        {children}
      </div>
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex items-center justify-end gap-3">
        {saveSuccess && (
          <span className="text-sm text-success flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            저장되었습니다
          </span>
        )}
        {saveError && (
          <span className="text-sm text-error">{saveError}</span>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
      <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

const inputClass = "w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors";
const selectClass = "w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white";

interface SectionSaveState {
  saving: boolean;
  error: string;
  success: boolean;
}

function useSaveState() {
  const [state, setState] = useState<SectionSaveState>({ saving: false, error: "", success: false });

  const save = async (fn: () => Promise<void>) => {
    setState({ saving: true, error: "", success: false });
    try {
      await fn();
      setState({ saving: false, error: "", success: true });
      setTimeout(() => setState((s) => ({ ...s, success: false })), 2000);
    } catch (err) {
      setState({ saving: false, error: err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.", success: false });
    }
  };

  return { ...state, save };
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);

  // Site settings
  const [siteName, setSiteName] = useState("Blogwise");
  const [siteDesc, setSiteDesc] = useState("AI 기반 자동 블로그 시스템");
  const [siteUrl, setSiteUrl] = useState("https://blogwise.kr");
  const [postsPerPage, setPostsPerPage] = useState("10");
  const [lang, setLang] = useState("ko");

  // AI settings
  const [openaiKey, setOpenaiKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [moonshotKey, setMoonshotKey] = useState("");
  const [moonshotModel, setMoonshotModel] = useState("kimi-2.5");
  const [defaultProvider, setDefaultProvider] = useState("claude");
  const [maxTokens, setMaxTokens] = useState("4000");

  // Adsense settings
  const [adsenseId, setAdsenseId] = useState("ca-pub-0000000000000000");
  const [adsenseEnabled, setAdsenseEnabled] = useState(true);
  const [adUnit1, setAdUnit1] = useState("1234567890");
  const [adUnit2, setAdUnit2] = useState("0987654321");

  // Crawl settings
  const [crawlInterval, setCrawlInterval] = useState("60");
  const [maxItems, setMaxItems] = useState("50");
  const [crawlEnabled, setCrawlEnabled] = useState(true);
  const [userAgent, setUserAgent] = useState("Blogwise-Bot/1.0");

  const siteSave = useSaveState();
  const aiSave = useSaveState();
  const adsenseSave = useSaveState();
  const crawlSave = useSaveState();

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = await res.json();


        // API returns { settings: { key: value } } — flat key-value from site_settings table
        // OR for mock mode: { settings: { site_name, site_description, ... } }
        const s: Record<string, unknown> = data.settings ?? {};

        // Site
        if (s.site_name !== undefined) setSiteName(String(s.site_name));
        if (s.site_description !== undefined) setSiteDesc(String(s.site_description));
        if (s.site_url !== undefined) setSiteUrl(String(s.site_url));
        if (s.posts_per_page !== undefined) setPostsPerPage(String(s.posts_per_page));
        if (s.default_language !== undefined) setLang(String(s.default_language));

        // AI
        if (s.default_ai_provider !== undefined) setDefaultProvider(String(s.default_ai_provider));
        if (s.max_tokens !== undefined) setMaxTokens(String(s.max_tokens));
        // API keys arrive masked from server; keep state empty so placeholder shows
        if (s.openai_api_key) setOpenaiKey(String(s.openai_api_key));
        if (s.claude_api_key) setClaudeKey(String(s.claude_api_key));
        if (s.gemini_api_key) setGeminiKey(String(s.gemini_api_key));
        if (s.moonshot_api_key) setMoonshotKey(String(s.moonshot_api_key));
        if (s.moonshot_model) setMoonshotModel(String(s.moonshot_model));

        // Adsense
        if (s.adsense_enabled !== undefined) setAdsenseEnabled(Boolean(s.adsense_enabled));
        if (s.adsense_publisher_id !== undefined) setAdsenseId(String(s.adsense_publisher_id));
        if (s.adsense_ad_unit_1 !== undefined) setAdUnit1(String(s.adsense_ad_unit_1));
        if (s.adsense_ad_unit_2 !== undefined) setAdUnit2(String(s.adsense_ad_unit_2));

        // Crawl
        if (s.crawl_enabled !== undefined) setCrawlEnabled(Boolean(s.crawl_enabled));
        if (s.crawl_interval_minutes !== undefined) setCrawlInterval(String(s.crawl_interval_minutes));
        if (s.crawl_max_items !== undefined) setMaxItems(String(s.crawl_max_items));
        if (s.crawl_user_agent !== undefined) setUserAgent(String(s.crawl_user_agent));
      } catch {
        // Keep defaults on error
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // API PUT expects a flat { key: value } object matching site_settings table keys
  const saveSiteSettings = () =>
    siteSave.save(async () => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_name: siteName,
          site_description: siteDesc,
          site_url: siteUrl,
          posts_per_page: postsPerPage,
          default_language: lang,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
    });

  const saveAiSettings = () =>
    aiSave.save(async () => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          default_ai_provider: defaultProvider,
          max_tokens: maxTokens,
          openai_api_key: openaiKey,
          claude_api_key: claudeKey,
          gemini_api_key: geminiKey,
          moonshot_api_key: moonshotKey,
          moonshot_model: moonshotModel,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
    });

  const saveAdsenseSettings = () =>
    adsenseSave.save(async () => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adsense_enabled: adsenseEnabled,
          adsense_publisher_id: adsenseId,
          adsense_ad_unit_1: adUnit1,
          adsense_ad_unit_2: adUnit2,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
    });

  const saveCrawlSettings = () =>
    crawlSave.save(async () => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crawl_enabled: crawlEnabled,
          crawl_interval_minutes: crawlInterval,
          crawl_max_items: maxItems,
          crawl_user_agent: userAgent,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "저장에 실패했습니다.");
      }
    });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-sm text-gray-500 mt-1">Blogwise 시스템 설정을 관리하세요.</p>
      </div>

      {/* 사이트 기본 설정 */}
      <SectionCard
        title="사이트 기본 설정"
        description="블로그의 기본 정보를 설정합니다."
        onSave={saveSiteSettings}
        saving={loading || siteSave.saving}
        saveError={siteSave.error}
        saveSuccess={siteSave.success}
      >
        <FormField label="사이트명">
          <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="사이트 설명">
          <textarea value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} rows={2} className={cn(inputClass, "resize-none")} />
        </FormField>
        <FormField label="사이트 URL" hint="https://로 시작해야 합니다">
          <input type="url" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} className={inputClass} />
        </FormField>
        <FormField label="페이지당 게시물 수">
          <select value={postsPerPage} onChange={(e) => setPostsPerPage(e.target.value)} className={selectClass}>
            {["5", "10", "15", "20", "30"].map((n) => <option key={n}>{n}</option>)}
          </select>
        </FormField>
        <FormField label="기본 언어">
          <select value={lang} onChange={(e) => setLang(e.target.value)} className={selectClass}>
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </FormField>
      </SectionCard>

      {/* AI 설정 */}
      <SectionCard
        title="AI 설정"
        description="AI 글 생성에 사용할 API 키와 설정을 입력합니다."
        onSave={saveAiSettings}
        saving={loading || aiSave.saving}
        saveError={aiSave.error}
        saveSuccess={aiSave.success}
      >
        <FormField label="기본 AI 제공사">
          <select value={defaultProvider} onChange={(e) => setDefaultProvider(e.target.value)} className={selectClass}>
            <option value="openai">OpenAI GPT-4o</option>
            <option value="claude">Anthropic Claude</option>
            <option value="gemini">Google Gemini</option>
            <option value="moonshot">Moonshot AI (Kimi 2.5)</option>
          </select>
        </FormField>
        <FormField label="OpenAI API Key" hint="sk-로 시작하는 키">
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            className={inputClass}
            placeholder="변경하려면 새 키를 입력하세요"
          />
        </FormField>
        <FormField label="Anthropic API Key" hint="sk-ant-로 시작하는 키">
          <input
            type="password"
            value={claudeKey}
            onChange={(e) => setClaudeKey(e.target.value)}
            className={inputClass}
            placeholder="변경하려면 새 키를 입력하세요"
          />
        </FormField>
        <FormField label="Google Gemini API Key">
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className={inputClass}
            placeholder="변경하려면 새 키를 입력하세요"
          />
        </FormField>
        <FormField label="Moonshot API Key" hint="Kimi 2.5 API 키 (sk-로 시작)">
          <input
            type="password"
            value={moonshotKey}
            onChange={(e) => setMoonshotKey(e.target.value)}
            className={inputClass}
            placeholder="변경하려면 새 키를 입력하세요"
          />
        </FormField>
        <FormField label="Kimi 모델" hint="Moonshot AI 모델 버전">
          <select value={moonshotModel} onChange={(e) => setMoonshotModel(e.target.value)} className={selectClass}>
            <option value="kimi-2.5">Kimi 2.5 (최신)</option>
            <option value="moonshot-v1-128k">Moonshot v1 128K</option>
            <option value="moonshot-v1-32k">Moonshot v1 32K</option>
            <option value="moonshot-v1-8k">Moonshot v1 8K</option>
          </select>
        </FormField>
        <FormField label="최대 토큰 수" hint="생성할 글의 최대 길이">
          <select value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} className={selectClass}>
            {["1000", "2000", "4000", "8000", "16000"].map((n) => <option key={n}>{n}</option>)}
          </select>
        </FormField>
      </SectionCard>

      {/* 애드센스 설정 */}
      <SectionCard
        title="애드센스 설정"
        description="Google AdSense 광고 설정을 관리합니다."
        onSave={saveAdsenseSettings}
        saving={loading || adsenseSave.saving}
        saveError={adsenseSave.error}
        saveSuccess={adsenseSave.success}
      >
        <FormField label="애드센스 활성화">
          <button
            onClick={() => setAdsenseEnabled((v) => !v)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
              adsenseEnabled ? "bg-primary-600" : "bg-gray-300"
            )}
          >
            <span className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
              adsenseEnabled ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </FormField>
        <FormField label="Publisher ID" hint="ca-pub-으로 시작하는 ID">
          <input
            type="text"
            value={adsenseId}
            onChange={(e) => setAdsenseId(e.target.value)}
            disabled={!adsenseEnabled}
            className={cn(inputClass, !adsenseEnabled && "opacity-50 cursor-not-allowed")}
          />
        </FormField>
        <FormField label="광고 단위 1 (상단)">
          <input
            type="text"
            value={adUnit1}
            onChange={(e) => setAdUnit1(e.target.value)}
            disabled={!adsenseEnabled}
            className={cn(inputClass, !adsenseEnabled && "opacity-50 cursor-not-allowed")}
          />
        </FormField>
        <FormField label="광고 단위 2 (사이드바)">
          <input
            type="text"
            value={adUnit2}
            onChange={(e) => setAdUnit2(e.target.value)}
            disabled={!adsenseEnabled}
            className={cn(inputClass, !adsenseEnabled && "opacity-50 cursor-not-allowed")}
          />
        </FormField>
      </SectionCard>

      {/* 크롤링 설정 */}
      <SectionCard
        title="크롤링 설정"
        description="자동 크롤링 주기와 옵션을 설정합니다."
        onSave={saveCrawlSettings}
        saving={loading || crawlSave.saving}
        saveError={crawlSave.error}
        saveSuccess={crawlSave.success}
      >
        <FormField label="자동 크롤링">
          <button
            onClick={() => setCrawlEnabled((v) => !v)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
              crawlEnabled ? "bg-primary-600" : "bg-gray-300"
            )}
          >
            <span className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
              crawlEnabled ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </FormField>
        <FormField label="크롤링 주기" hint="분 단위">
          <select value={crawlInterval} onChange={(e) => setCrawlInterval(e.target.value)} className={selectClass}>
            <option value="30">30분마다</option>
            <option value="60">1시간마다</option>
            <option value="120">2시간마다</option>
            <option value="360">6시간마다</option>
            <option value="720">12시간마다</option>
            <option value="1440">24시간마다</option>
          </select>
        </FormField>
        <FormField label="소스당 최대 수집 수">
          <select value={maxItems} onChange={(e) => setMaxItems(e.target.value)} className={selectClass}>
            {["10", "20", "50", "100", "200"].map((n) => <option key={n}>{n}개</option>)}
          </select>
        </FormField>
        <FormField label="User-Agent" hint="크롤러 식별 문자열">
          <input
            type="text"
            value={userAgent}
            onChange={(e) => setUserAgent(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </SectionCard>
    </div>
  );
}
