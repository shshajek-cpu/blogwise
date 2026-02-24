"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface Post {
  id: string;
  title: string;
  category: string;
  status: "발행됨" | "초안" | "예약" | "보관";
  createdAt: string;
  views: number;
  content?: string;
}

const mockPosts: Post[] = [
  { id: "mock-1", title: "2025 최신 Next.js 15 완전 가이드", category: "웹개발", status: "발행됨", createdAt: "2025-01-20", views: 3420 },
  { id: "mock-2", title: "TypeScript 고급 패턴 10가지", category: "프로그래밍", status: "발행됨", createdAt: "2025-01-19", views: 2180 },
  { id: "mock-3", title: "React 19 새 기능 총정리", category: "웹개발", status: "초안", createdAt: "2025-01-18", views: 0 },
  { id: "mock-4", title: "Tailwind CSS v4 마이그레이션 방법", category: "웹개발", status: "예약", createdAt: "2025-01-17", views: 0 },
  { id: "mock-5", title: "Supabase + Next.js 인증 구현하기", category: "백엔드", status: "발행됨", createdAt: "2025-01-16", views: 1890 },
  { id: "mock-6", title: "파이썬으로 배우는 머신러닝 기초", category: "AI/ML", status: "발행됨", createdAt: "2025-01-15", views: 4210 },
  { id: "mock-7", title: "Docker 컨테이너 완벽 가이드", category: "DevOps", status: "보관", createdAt: "2025-01-14", views: 890 },
  { id: "mock-8", title: "GraphQL vs REST API 심층 비교", category: "백엔드", status: "초안", createdAt: "2025-01-13", views: 0 },
  { id: "mock-9", title: "Kubernetes 입문 - 실무 활용편", category: "DevOps", status: "발행됨", createdAt: "2025-01-12", views: 2650 },
  { id: "mock-10", title: "웹 접근성 완벽 가이드 A11y", category: "웹개발", status: "예약", createdAt: "2025-01-11", views: 0 },
];

const tabs = ["전체", "발행됨", "초안", "예약", "보관"] as const;
type Tab = typeof tabs[number];

const statusBadgeClass: Record<string, string> = {
  "발행됨": "bg-success-light text-success",
  "초안": "bg-gray-100 text-gray-600",
  "예약": "bg-scheduled-light text-scheduled",
  "보관": "bg-warning-light text-warning",
};

const statusMap: Record<string, string> = {
  published: "발행됨",
  draft: "초안",
  scheduled: "예약",
  archived: "보관",
};

const PAGE_SIZE = 10;

export default function ContentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("전체");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(mockPosts.length);
  const [page, setPage] = useState(1);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({
    "전체": mockPosts.length,
    "발행됨": mockPosts.filter((p) => p.status === "발행됨").length,
    "초안": mockPosts.filter((p) => p.status === "초안").length,
    "예약": mockPosts.filter((p) => p.status === "예약").length,
    "보관": mockPosts.filter((p) => p.status === "보관").length,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "전체") {
        const reverseStatus: Record<string, string> = {
          "발행됨": "published",
          "초안": "draft",
          "예약": "scheduled",
          "보관": "archived",
        };
        params.set("status", reverseStatus[activeTab] ?? activeTab);
      }
      if (search) params.set("search", search);
      if (categoryFilter !== "전체") params.set("category", categoryFilter);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();

      if (data.posts) {
        const mapped: Post[] = data.posts.map((p: {
          id: string;
          title: string;
          category?: { name: string } | string;
          status: string;
          created_at: string;
          view_count?: number;
        }) => ({
          id: p.id,
          title: p.title,
          category: typeof p.category === "object" && p.category !== null
            ? p.category.name
            : (p.category as string) ?? "",
          status: (statusMap[p.status] ?? p.status) as Post["status"],
          createdAt: p.created_at ? p.created_at.slice(0, 10) : "",
          views: p.view_count ?? 0,
        }));
        setPosts(mapped);
        setTotalCount(data.total ?? mapped.length);

        // Update tab counts if API provides them
        if (data.counts) {
          setTabCounts({
            "전체": data.counts.total ?? mapped.length,
            "발행됨": data.counts.published ?? 0,
            "초안": data.counts.draft ?? 0,
            "예약": data.counts.scheduled ?? 0,
            "보관": data.counts.archived ?? 0,
          });
        }
      }
    } catch {
      // Fall back to mock data with client-side filtering
      const filtered = mockPosts.filter((p) => {
        const matchTab = activeTab === "전체" || p.status === activeTab;
        const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === "전체" || p.category === categoryFilter;
        return matchTab && matchSearch && matchCategory;
      });
      setPosts(filtered);
      setTotalCount(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, categoryFilter, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, search, categoryFilter]);

  const categories = ["전체", ...Array.from(new Set(mockPosts.map((p) => p.category)))];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 게시물을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPosts();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (res.ok) {
        fetchPosts();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "발행에 실패했습니다.");
      }
    } catch {
      alert("발행 중 오류가 발생했습니다.");
    }
  };

  const handleBulkPublish = async () => {
    if (!confirm(`${selectedIds.size}개 게시물을 발행하시겠습니까?`)) return;
    for (const id of selectedIds) {
      await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      }).catch(() => {});
    }
    setSelectedIds(new Set());
    fetchPosts();
  };

  const handleBulkDelete = async () => {
    if (!confirm(`${selectedIds.size}개 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    for (const id of selectedIds) {
      await fetch(`/api/posts/${id}`, { method: "DELETE" }).catch(() => {});
    }
    setSelectedIds(new Set());
    fetchPosts();
  };

  const handleDeleteAll = async () => {
    if (!confirm("현재 탭의 모든 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    if (!confirm("정말 삭제하시겠습니까? 한 번 더 확인합니다.")) return;
    const idsToDelete = posts.map((p) => p.id);
    for (const id of idsToDelete) {
      await fetch(`/api/posts/${id}`, { method: "DELETE" }).catch(() => {});
    }
    setSelectedIds(new Set());
    fetchPosts();
  };

  const handleExpand = async (post: Post) => {
    if (expandedId === post.id) {
      setExpandedId(null);
      return;
    }
    try {
      const res = await fetch(`/api/posts/${post.id}`);
      if (res.ok) {
        const data = await res.json();
        setEditContent(data.post?.content ?? "");
        setEditExcerpt(data.post?.excerpt ?? "");
      }
    } catch {
      setEditContent("");
      setEditExcerpt("");
    }
    setExpandedId(post.id);
  };

  const handleInlineSave = async (postId: string, publish?: boolean) => {
    setEditSaving(true);
    try {
      const body: Record<string, unknown> = {
        content: editContent,
        excerpt: editExcerpt,
      };
      if (publish) body.status = "published";
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setExpandedId(null);
        fetchPosts();
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setEditSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
          <p className="text-sm text-gray-500 mt-1">발행된 글과 초안을 관리하세요.</p>
        </div>
        <button
          onClick={() => router.push("/admin/generate")}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          새 글 작성
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab) => {
          const count = tabCounts[tab] ?? 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5",
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeTab === tab ? "bg-primary-100 text-primary-700" : "bg-gray-200 text-gray-500"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목으로 검색..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{selectedIds.size}개 선택됨</span>
            <button
              onClick={handleBulkPublish}
              className="px-3 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              일괄 발행
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              선택 삭제
            </button>
          </div>
        )}
        {posts.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="px-3 py-2 text-sm font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
          >
            전체 삭제
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === posts.length && posts.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">제목</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">카테고리</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">작성일</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">조회수</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-12" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><div className="h-4 bg-gray-200 rounded w-10" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                posts.map((post) => (
                  <React.Fragment key={post.id}>
                    <tr className={cn("hover:bg-gray-50 transition-colors", selectedIds.has(post.id) && "bg-primary-50")}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(post.id)}
                          onChange={() => toggleSelect(post.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => handleExpand(post)}>
                        <div className="flex items-center gap-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={cn("w-4 h-4 text-gray-400 transition-transform flex-shrink-0", expandedId === post.id && "rotate-90")}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                          <p className="font-medium text-gray-900 truncate max-w-[250px]">{post.title}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{post.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusBadgeClass[post.status])}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{post.createdAt}</td>
                      <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">
                        {post.views > 0 ? post.views.toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === "초안" && (
                            <button
                              onClick={() => handlePublish(post.id)}
                              className="text-xs text-green-600 hover:text-green-800 font-medium"
                            >
                              발행
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/admin/contents/${post.id}/edit`)}
                            className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="text-xs text-error hover:text-red-700 font-medium"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === post.id && (
                      <tr key={`${post.id}-expanded`} className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3 max-w-3xl">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">요약</label>
                              <textarea
                                value={editExcerpt}
                                onChange={(e) => setEditExcerpt(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">본문 (마크다운)</label>
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={12}
                                className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono resize-y"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleInlineSave(post.id)}
                                disabled={editSaving}
                                className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                {editSaving ? "저장 중..." : "저장"}
                              </button>
                              {post.status === "초안" && (
                                <button
                                  onClick={() => handleInlineSave(post.id, true)}
                                  disabled={editSaving}
                                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  {editSaving ? "처리 중..." : "저장 후 발행"}
                                </button>
                              )}
                              <button
                                onClick={() => setExpandedId(null)}
                                className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-500 hover:text-gray-700"
                              >
                                닫기
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && posts.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">
            검색 결과가 없습니다.
          </div>
        )}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-500">총 {totalCount}개의 게시물</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "px-2 py-1 text-xs rounded border",
                  p === page
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
