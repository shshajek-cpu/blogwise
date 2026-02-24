"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/blog/SearchBar";
import PostCard from "@/components/blog/PostCard";
import AdSlot from "@/components/blog/AdSlot";
import { Post } from "@/components/blog/PostCard";

function SearchResults() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Post[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
    if (q.trim()) {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data.posts ?? []);
          setSearched(true);
        })
        .catch(() => {
          setResults([]);
          setSearched(true);
        });
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [searchParams]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">검색</h1>

      <SearchBar initialQuery={query} placeholder="검색어를 입력하세요..." className="mb-8" />

      {/* Ad */}
      <div className="flex justify-center mb-8">
        <AdSlot position="in-feed" />
      </div>

      {/* Results */}
      {searched && (
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {query && (
              <>
                <span className="font-semibold text-gray-900">&ldquo;{query}&rdquo;</span> 검색 결과{" "}
                <span className="font-semibold text-primary-600">{results.length}건</span>
              </>
            )}
          </p>
        </div>
      )}

      {searched && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {results.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-base font-medium text-gray-500 mb-2">검색 결과가 없습니다.</p>
          <p className="text-sm text-gray-400">다른 키워드로 검색해보세요.</p>
        </div>
      )}

      {!searched && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">추천 글</h2>
          <RecommendedPosts />
        </div>
      )}
    </div>
  );
}

function RecommendedPosts() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/search?q=")
      .then(() => {
        // Empty search returns no results; fetch popular posts from sidebar API
        return fetch("/api/sidebar");
      })
      .then((res) => res.json())
      .then((data) => {
        setPosts((data.popularPosts ?? []).slice(0, 4));
      })
      .catch(() => setPosts([]));
  }, []);

  if (posts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
