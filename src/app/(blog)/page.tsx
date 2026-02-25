import React from "react";
import Link from "next/link";
import PostCard from "@/components/blog/PostCard";
import AdSlot from "@/components/blog/AdSlot";
import BlogSidebar from "@/components/layout/BlogSidebar";
import CategoryNav from "@/components/blog/CategoryNav";
import PageViewTracker from "@/components/blog/PageViewTracker";
import { getPublishedPosts, getCategories } from "@/lib/supabase/queries";

export const revalidate = 60;

export default async function BlogHomePage() {
  const [{ posts }, categories] = await Promise.all([
    getPublishedPosts({ limit: 7 }),
    getCategories(),
  ]);

  const featuredPost = posts[0];
  const latestPosts = posts.slice(1);

  if (!featuredPost) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500 text-center py-20">아직 게시된 글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageViewTracker path="/" />
      {/* Top Banner Ad */}
      <div className="mb-8 flex justify-center">
        <AdSlot position="top-banner" />
      </div>

      {/* Category Nav */}
      <CategoryNav categories={[{ name: "전체", slug: "" }, ...categories]} className="mb-8" />

      {/* Hero: Featured Post */}
      <section className="mb-10">
        <Link
          href={`/posts/${featuredPost.slug}`}
          className="group relative flex flex-col md:flex-row overflow-hidden rounded-2xl bg-white border border-gray-100 hover:shadow-xl transition-all duration-300"
        >
          {/* Thumbnail */}
          <div className="relative md:w-1/2 aspect-video md:aspect-auto bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-300 via-primary-500 to-primary-800 group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-20 h-20 text-white/15" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96a.75.75 0 000-1.06L18.02.29a.75.75 0 00-1.06 0L15.13 2.12 18.88 5.87 20.71 4.04z" />
              </svg>
            </div>
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-primary-600">
              {featuredPost.category.name}
            </span>
            <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-primary-600 text-white">
              추천
            </span>
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center p-6 md:p-10 md:w-1/2 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">
              {featuredPost.title}
            </h1>
            <p className="text-gray-500 leading-relaxed line-clamp-3">
              {featuredPost.excerpt}
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span>{new Date(featuredPost.publishedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</span>
              <span>·</span>
              <span>{featuredPost.readTime}분 읽기</span>
            </div>
            <span className="inline-flex items-center gap-1 text-primary-600 text-sm font-semibold group-hover:gap-2 transition-all">
              자세히 읽기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </Link>
      </section>

      {/* Main content + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Main */}
        <section className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">최신 글</h2>
            <Link href="/posts" className="text-sm text-primary-600 hover:underline font-medium">
              전체 보기
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {latestPosts.map((post, i) => (
              <React.Fragment key={post.slug}>
                <PostCard post={post} />
                {/* In-feed ad after 3rd card */}
                {i === 2 && (
                  <div className="sm:col-span-2 xl:col-span-3 flex justify-center my-2">
                    <AdSlot position="in-feed" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="lg:w-80 shrink-0">
          <BlogSidebar />
        </aside>
      </div>

      {/* Editor's Pick / Trending Topics */}
      <section className="mt-12 pt-10 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 rounded-full bg-accent inline-block" />
            <h2 className="text-xl font-bold text-gray-900">트렌딩 토픽</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {["ChatGPT 활용법", "Next.js 16", "AI 자동화", "React 19", "원격근무 팁", "생산성 도구"].map((topic) => (
            <Link
              key={topic}
              href={`/search?q=${encodeURIComponent(topic)}`}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors">{topic}</span>
              <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
