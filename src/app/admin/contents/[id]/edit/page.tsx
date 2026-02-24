"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface PostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
  ai_provider: string;
  ai_model: string;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState("draft");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (data.post) {
          setPost(data.post);
          setTitle(data.post.title ?? "");
          setContent(data.post.content ?? "");
          setExcerpt(data.post.excerpt ?? "");
          setStatus(data.post.status ?? "draft");
          setSeoTitle(data.post.seo_title ?? "");
          setSeoDescription(data.post.seo_description ?? "");
        }
      } catch {
        setError("포스트를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  const handleSave = async (newStatus?: string) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body: Record<string, unknown> = {
        title,
        content,
        excerpt,
        status: newStatus ?? status,
        seo_title: seoTitle,
        seo_description: seoDescription,
      };

      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "저장 실패");
      }

      setSuccess(newStatus === "published" ? "발행되었습니다!" : "저장되었습니다!");
      if (newStatus) setStatus(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto py-10 text-center">
        <p className="text-gray-500">{error || "포스트를 찾을 수 없습니다."}</p>
        <button onClick={() => router.push("/admin/contents")} className="mt-4 text-primary-600 hover:underline text-sm">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    draft: "초안",
    published: "발행됨",
    scheduled: "예약",
    archived: "보관",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/contents")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">글 수정</h1>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            status === "published" ? "bg-green-100 text-green-700" :
            status === "draft" ? "bg-gray-100 text-gray-600" :
            "bg-yellow-100 text-yellow-700"
          )}>
            {statusLabels[status] ?? status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          {status !== "published" && (
            <button
              onClick={() => handleSave("published")}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "처리 중..." : "발행하기"}
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-md bg-green-50 text-green-700 text-sm">{success}</div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">요약 (Excerpt)</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">본문 (마크다운)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono resize-y"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="draft">초안</option>
            <option value="published">발행됨</option>
            <option value="scheduled">예약</option>
            <option value="archived">보관</option>
          </select>
        </div>
      </div>

      {/* SEO Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">SEO 설정</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SEO 제목</label>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SEO 설명</label>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        {/* Meta info */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
          {post.ai_provider && <span>AI: {post.ai_provider} / {post.ai_model}</span>}
          <span>생성일: {new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
          {post.updated_at && <span>수정일: {new Date(post.updated_at).toLocaleDateString("ko-KR")}</span>}
        </div>
      </div>
    </div>
  );
}
