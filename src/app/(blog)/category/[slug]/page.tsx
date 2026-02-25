import { notFound } from "next/navigation";
import PostCard from "@/components/blog/PostCard";
import AdSlot from "@/components/blog/AdSlot";
import CategoryNav from "@/components/blog/CategoryNav";
import { getCategories, getPublishedPosts } from "@/lib/supabase/queries";

export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "카테고리" };
  return {
    title: `${category.name} - Blogwise`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const [categories, { posts }] = await Promise.all([
    getCategories(),
    getPublishedPosts({ categorySlug: slug }),
  ]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Nav */}
      <CategoryNav
        categories={[{ name: "전체", slug: "" }, ...categories]}
        activeSlug={category.slug}
        className="mb-8"
      />

      {/* Category Header */}
      <header className="mb-10 pb-8 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
            카테고리
          </span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{category.name}</h1>
        <p className="text-gray-500 text-base max-w-xl">{category.description}</p>
        <p className="text-sm text-gray-400 mt-2">총 {posts.length}개의 글</p>
      </header>

      {/* In-feed Ad */}
      <div className="flex justify-center mb-8">
        <AdSlot position="in-feed" />
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>

      {posts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-base font-medium text-gray-400">아직 이 카테고리에 글이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
