"use client";

import { useEffect, useState, useRef } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  className?: string;
}

export default function TableOfContents({ className = "" }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Extract headings from article
    const article = document.querySelector("article");
    if (!article) return;

    const headings = Array.from(article.querySelectorAll("h2, h3, h4"));
    const tocItems: TocItem[] = headings.map((el, i) => {
      if (!el.id) el.id = `heading-${i}`;
      return {
        id: el.id,
        text: el.textContent ?? "",
        level: parseInt(el.tagName[1], 10),
      };
    });
    setItems(tocItems);

    // Intersection observer for active heading
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "0px 0px -60% 0px", threshold: 0 }
    );

    headings.forEach((h) => observerRef.current?.observe(h));

    return () => observerRef.current?.disconnect();
  }, []);

  if (items.length === 0) return null;

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <nav
      className={`rounded-xl border border-gray-100 bg-gray-50 p-4 ${className}`}
      aria-label="목차"
    >
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">목차</p>
      <ol className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => scrollTo(item.id)}
              className={`text-left w-full text-sm leading-snug transition-colors rounded px-2 py-1 ${
                item.level === 2 ? "pl-2" : item.level === 3 ? "pl-5" : "pl-8"
              } ${
                activeId === item.id
                  ? "text-primary-600 font-semibold bg-primary-50"
                  : "text-gray-600 hover:text-primary-600 hover:bg-gray-100"
              }`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
