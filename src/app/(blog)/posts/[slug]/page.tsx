import React from "react";
import { notFound } from "next/navigation";
import PostCard from "@/components/blog/PostCard";
import AdSlot from "@/components/blog/AdSlot";
import ShareButtons from "@/components/blog/ShareButtons";
import TableOfContents from "@/components/blog/TableOfContents";
import PageViewTracker from "@/components/blog/PageViewTracker";
import { getPostBySlug, getRelatedPosts, trackPageView } from "@/lib/supabase/queries";
import { generateJsonLd, generateBreadcrumbJsonLd } from "@/lib/utils/seo";

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "포스트를 찾을 수 없습니다" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

/** Render inline markdown spans: bold, italic, inline code, links */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Combined regex: **bold**, *italic*, `code`, [text](url)
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2] !== undefined) {
      parts.push(<strong key={idx++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={idx++}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      parts.push(<code key={idx++}>{match[4]}</code>);
    } else if (match[5] !== undefined) {
      parts.push(<a key={idx++} href={match[6]} target="_blank" rel="noopener noreferrer">{match[5]}</a>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
}

/** Render a full markdown string into React nodes */
function renderMarkdown(content: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = content.split("\n");
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      nodes.push(
        <pre key={key++}>
          <code className={lang ? `language-${lang}` : undefined}>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Headings
    if (line.startsWith("#### ")) {
      nodes.push(<h4 key={key++}>{renderInline(line.slice(5))}</h4>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      nodes.push(<h3 key={key++}>{renderInline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(<h2 key={key++}>{renderInline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(<h1 key={key++}>{renderInline(line.slice(2))}</h1>);
      i++; continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      nodes.push(<hr key={key++} />);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <blockquote key={key++}>
          {quoteLines.map((ql, qi) => <p key={qi}>{renderInline(ql)}</p>)}
        </blockquote>
      );
      continue;
    }

    // Unordered list (- or *)
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={key++}>
          {items.map((item, ii) => <li key={ii}>{renderInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list (1. 2. etc.)
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      nodes.push(
        <ol key={key++}>
          {items.map((item, ii) => <li key={ii}>{renderInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Empty line — skip (paragraph breaks handled by block collection below)
    if (line.trim() === "") {
      i++; continue;
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("> ") &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^\*\*\*+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      nodes.push(<p key={key++}>{renderInline(paraLines.join(" "))}</p>);
    }
  }

  return nodes;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(slug, post.category.slug);

  // Fire-and-forget page view tracking
  trackPageView(slug, '/posts/' + slug);

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Generate JSON-LD structured data
  const articleJsonLd = generateJsonLd('Article', {
    title: post.title,
    description: post.excerpt,
    url: `/posts/${post.slug}`,
    image: post.thumbnail,
    publishedAt: post.publishedAt,
    modifiedAt: post.publishedAt,
    authorName: 'Blogwise',
  });

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: '홈', url: '/' },
    { name: post.category.name, url: `/category/${post.category.slug}` },
    { name: post.title, url: `/posts/${post.slug}` },
  ]);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Banner Ad */}
        <div className="mb-8 flex justify-center">
          <AdSlot position="top-banner" />
        </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Article */}
        <article className="flex-1 min-w-0">
          {/* Article Header */}
          <header className="mb-8">
            <div className="mb-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                {post.category.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-6">
              <span>{formattedDate}</span>
              <span>·</span>
              <span>{post.readTime}분 읽기</span>
            </div>

            {/* Featured Image */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary-300 via-primary-500 to-primary-700 mb-6 flex items-center justify-center">
              <span className="text-white/20 text-9xl font-black select-none">B</span>
            </div>

            {/* Share Buttons */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-gray-100">
              <p className="text-gray-600 text-base leading-relaxed max-w-2xl">{post.excerpt}</p>
              <ShareButtons title={post.title} />
            </div>
          </header>

          {/* In-article Ad */}
          <div className="flex justify-center my-8">
            <AdSlot position="in-article" />
          </div>

          {/* Article Content */}
          <div className="prose prose-lg prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-primary-600 prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:rounded prose-code:px-1">
            {renderMarkdown(post.content)}
          </div>

          {/* Second In-article Ad */}
          <div className="flex justify-center my-8">
            <AdSlot position="in-article" />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-8 border-t border-gray-100 mb-8">
              <span className="text-sm font-medium text-gray-500 mr-1">태그:</span>
              {post.tags.map((tag: string) => (
                <a
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors"
                >
                  {tag}
                </a>
              ))}
            </div>
          )}

          {/* Share Buttons (bottom) */}
          <div className="flex justify-center py-6 border-t border-b border-gray-100 mb-10">
            <ShareButtons title={post.title} />
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">관련 글</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedPosts.map((rp) => (
                  <PostCard key={rp.slug} post={rp} />
                ))}
              </div>
            </section>
          )}
          <PageViewTracker postSlug={slug} path={'/posts/' + slug} />
        </article>

        {/* TOC Sidebar */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="sticky top-24">
            <TableOfContents />
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}
