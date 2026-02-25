"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface CategoryItem {
  name: string;
  slug: string;
}

const fallbackCategories: CategoryItem[] = [
  { name: "기술", slug: "tech" },
  { name: "AI", slug: "ai" },
  { name: "라이프스타일", slug: "lifestyle" },
  { name: "개발", slug: "dev" },
  { name: "비즈니스", slug: "business" },
];

function CategoryDropdown({ categories }: { categories: CategoryItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        카테고리
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <Link
      href="/search"
      className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-gray-100 transition-colors"
      aria-label="검색"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </Link>
  );
}

export default function Header({ categories: propCategories }: { categories?: CategoryItem[] } = {}) {
  const categories = propCategories && propCategories.length > 0 ? propCategories : fallbackCategories;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Top accent bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-primary-500 via-primary-400 to-accent" />
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-xl font-bold text-primary-600 tracking-tight">
              Blogwise
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
                홈
              </Link>
              <Link href="/posts" className="text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
                최신글
              </Link>
              <CategoryDropdown categories={categories} />
              <SearchIcon />
              <Link
                href="/subscribe"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                구독하기
              </Link>
            </nav>

            {/* Mobile: search + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <SearchIcon />
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                aria-label="메뉴 열기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="모바일 메뉴"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Link href="/" className="text-xl font-bold text-primary-600" onClick={() => setMobileOpen(false)}>
            Blogwise
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="메뉴 닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="px-4 py-6 flex flex-col gap-1">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
          >
            홈
          </Link>
          <Link
            href="/posts"
            onClick={() => setMobileOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
          >
            최신글
          </Link>
          <div className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">카테고리</div>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <div className="mt-4 px-3">
            <Link
              href="/subscribe"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
            >
              구독하기
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
