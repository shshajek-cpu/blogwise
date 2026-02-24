import { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://blogwise.kr'

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  if (!isSupabaseConfigured()) {
    // Return base URLs with mock post data
    const mockPostUrls: MetadataRoute.Sitemap = [
      {
        url: `${SITE_URL}/posts/chatgpt-productivity-tips`,
        lastModified: new Date('2026-02-20'),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/posts/ai-trends-2026`,
        lastModified: new Date('2026-02-18'),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ]
    return [...baseUrls, ...mockPostUrls]
  }

  const supabase = createPublicClient()

  // Fetch all published posts
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, published_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .order('post_count', { ascending: false })

  const postUrls: MetadataRoute.Sitemap =
    posts?.map((post: { slug: string; published_at: string; updated_at?: string }) => ({
      url: `${SITE_URL}/posts/${post.slug}`,
      lastModified: new Date(post.updated_at || post.published_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) ?? []

  const categoryUrls: MetadataRoute.Sitemap =
    categories?.map((category: { slug: string; updated_at?: string }) => ({
      url: `${SITE_URL}/category/${category.slug}`,
      lastModified: new Date(category.updated_at || new Date()),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })) ?? []

  return [...baseUrls, ...categoryUrls, ...postUrls]
}
