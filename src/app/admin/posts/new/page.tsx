"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils/cn"
import { ImageUploader } from "@/components/admin/ImageUploader"

const TipTapEditor = dynamic(() => import("@/components/admin/TipTapEditor"), { ssr: false })

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function NewPostPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [featuredImage, setFeaturedImage] = useState("")
  const [content, setContent] = useState("")
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [seoKeywords, setSeoKeywords] = useState("")
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [aiProvider, setAiProvider] = useState("moonshot")
  const [sourceUrl, setSourceUrl] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.categories) setCategories(data.categories)
      })
      .catch(() => {})
  }, [])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    setSlug(slugify(value))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const trimmed = tagInput.trim()
      if (trimmed && !tags.includes(trimmed)) {
        setTags((prev) => [...prev, trimmed])
      }
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSave = async (status: "draft" | "published") => {
    if (!title.trim()) {
      setError("제목을 입력해주세요.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        slug: slug || slugify(title),
        content,
        status,
        category_id: categoryId || null,
        featured_image: featuredImage || null,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        seo_keywords: seoKeywords || null,
        ai_provider: aiProvider || null,
        source_url: sourceUrl || null,
      }
      if (status === "published") {
        body.published_at = new Date().toISOString()
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "저장에 실패했습니다.")
      }

      router.push("/admin/contents")
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">새 글 작성</h1>
          <p className="text-sm text-gray-500 mt-1">새로운 블로그 포스트를 작성하세요.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "초안 저장"}
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "발행"}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Main form */}
      <div className="space-y-5">
        {/* Title */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="블로그 포스트 제목을 입력하세요"
              className="w-full px-3 py-2.5 text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">슬러그</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 shrink-0">
                /blog/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-slug"
                className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Category & Tags */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">카테고리</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">카테고리 선택</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">태그</label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="태그 입력 후 Enter"
                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:text-primary-900"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Featured image */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">대표 이미지</label>
          <ImageUploader value={featuredImage} onChange={setFeaturedImage} />
        </div>

        {/* Content editor */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">내용</label>
          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="블로그 내용을 입력하세요..."
          />
        </div>

        {/* SEO settings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">SEO 설정</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO 제목</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="검색엔진에 표시될 제목 (비워두면 포스트 제목 사용)"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO 설명</label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="검색 결과에 표시될 설명 (160자 이내 권장)"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className={cn("text-xs mt-1", seoDescription.length > 160 ? "text-red-500" : "text-gray-400")}>
              {seoDescription.length} / 160자
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">키워드</label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="예: Next.js, React, 웹개발 (쉼표로 구분)"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* AI info */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">AI 정보</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">AI 제공사</label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="moonshot">Moonshot AI (Kimi)</option>
              <option value="openai">OpenAI GPT</option>
              <option value="claude">Anthropic Claude</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">소스 URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/source-article"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-end gap-2 pb-6">
        <button
          onClick={() => router.push("/admin/contents")}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
        <button
          onClick={() => handleSave("draft")}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          초안 저장
        </button>
        <button
          onClick={() => handleSave("published")}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "저장 중..." : "발행"}
        </button>
      </div>
    </div>
  )
}
