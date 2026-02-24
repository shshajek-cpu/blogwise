"use client";

import React, { useState } from "react";
import PostCard from "@/components/blog/PostCard";
import AdSlot from "@/components/blog/AdSlot";
import CategoryNav from "@/components/blog/CategoryNav";
import { Post } from "@/components/blog/PostCard";
import { CategoryData } from "@/lib/supabase/queries";

type SortOption = "latest" | "popular";

const PAGE_SIZE = 9;

interface PostsPageClientProps {
  initialPosts: Post[];
  categories: CategoryData[];
}

export default function PostsPageClient({ initialPosts, categories }: PostsPageClientProps) {
  const [sort, setSort] = useState<SortOption>("latest");
  const [page, setPage] = useState(1);

  const sorted: Post[] = [...initialPosts].sort((a, b) => {
    if (sort === "latest") {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
    // sort popularity by read time desc
    return b.readTime - a.readTime;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Nav */}
      <CategoryNav
        categories={[{ name: "전체", slug: "" }, ...categories]}
        className="mb-8"
      />

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">전체 글</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-500 sr-only">정렬</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => { setSort(e.target.value as SortOption); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
          </select>
        </div>
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {paginated.map((post, i) => (
          <React.Fragment key={post.slug}>
            <PostCard post={post} />
            {i === 5 && (
              <div className="sm:col-span-2 lg:col-span-3 flex justify-center my-2">
                <AdSlot position="in-feed" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2" role="navigation" aria-label="페이지 탐색">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="이전 페이지"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? "bg-primary-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="다음 페이지"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
