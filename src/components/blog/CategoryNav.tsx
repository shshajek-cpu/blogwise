"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Category {
  name: string;
  slug: string;
}

interface CategoryNavProps {
  categories: Category[];
  activeSlug?: string;
  className?: string;
}

const defaultCategories: Category[] = [
  { name: "전체", slug: "" },
  { name: "기술", slug: "tech" },
  { name: "AI", slug: "ai" },
  { name: "개발", slug: "dev" },
  { name: "라이프스타일", slug: "lifestyle" },
  { name: "비즈니스", slug: "business" },
  { name: "생산성", slug: "productivity" },
];

export default function CategoryNav({
  categories = defaultCategories,
  activeSlug,
  className = "",
}: CategoryNavProps) {
  const pathname = usePathname();

  function isActive(slug: string) {
    if (activeSlug !== undefined) return activeSlug === slug;
    if (slug === "") return pathname === "/posts";
    return pathname === `/category/${slug}`;
  }

  return (
    <nav
      className={`flex gap-2 overflow-x-auto scrollbar-hide pb-1 ${className}`}
      aria-label="카테고리 탐색"
    >
      {categories.map((cat) => {
        const active = isActive(cat.slug);
        const href = cat.slug === "" ? "/posts" : `/category/${cat.slug}`;
        return (
          <Link
            key={cat.slug || "all"}
            href={href}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              active
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {cat.name}
          </Link>
        );
      })}
    </nav>
  );
}
