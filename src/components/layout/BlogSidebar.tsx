"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdSlot from "@/components/blog/AdSlot";
import { Post } from "@/components/blog/PostCard";
import { CategoryData } from "@/lib/supabase/queries";

interface SidebarData {
  popularPosts: Post[];
  categories: CategoryData[];
  tags: string[];
}

export default function BlogSidebar() {
  const [data, setData] = useState<SidebarData | null>(null);

  useEffect(() => {
    fetch("/api/sidebar")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => setData(null));
  }, []);

  const popularPosts = data?.popularPosts ?? [];
  const categories = data?.categories ?? [];
  const tags = data?.tags ?? [];

  return (
    <aside className="flex flex-col gap-8">
      {/* Popular Posts */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary-600 inline-block" />
          인기글
        </h2>
        <ol className="flex flex-col gap-3">
          {popularPosts.map((post, i) => (
            <li key={post.slug}>
              <Link
                href={`/posts/${post.slug}`}
                className="flex items-start gap-3 group"
              >
                <span
                  className={`text-lg font-bold leading-none mt-0.5 w-6 shrink-0 ${
                    i === 0 ? "text-primary-600" : "text-gray-300"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {/* AdSense Slot 300x250 */}
      <AdSlot position="sidebar" className="w-full" />

      {/* Newsletter CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-400/10 rounded-full translate-y-6 -translate-x-6" />
        <div className="relative z-10">
          <h3 className="text-base font-bold mb-1">뉴스레터 구독</h3>
          <p className="text-sm text-primary-100 mb-4 leading-relaxed">
            매주 엄선된 기술 인사이트를<br />이메일로 받아보세요.
          </p>
          <form className="flex flex-col gap-2" onSubmit={(e: React.FormEvent) => e.preventDefault()}>
            <input
              type="email"
              placeholder="이메일 주소"
              className="w-full px-3 py-2 text-sm bg-white/15 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder:text-primary-200 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/30"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-semibold bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
            >
              무료 구독하기
            </button>
          </form>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary-600 inline-block" />
          카테고리
        </h2>
        <ul className="flex flex-col gap-1">
          {categories.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={`/category/${cat.slug}`}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors group"
              >
                <span>{cat.name}</span>
                <span className="text-xs text-gray-400 group-hover:text-primary-400 transition-colors">
                  {cat.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Tags Cloud */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary-600 inline-block" />
          태그
        </h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
