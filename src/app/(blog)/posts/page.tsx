import { getPublishedPosts, getCategories } from "@/lib/supabase/queries";
import PostsPageClient from "@/components/blog/PostsPageClient";

export const revalidate = 60;

export default async function PostsPage() {
  const [{ posts }, categories] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
  ]);
  return <PostsPageClient initialPosts={posts} categories={categories} />;
}
