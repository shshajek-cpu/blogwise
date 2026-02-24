// Server-side data access layer for BlogWise
// Falls back to mock data when Supabase is not configured

import type { Post as PostCardPost } from '@/components/blog/PostCard'

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSupabase(): Promise<any> {
  const { createClient } = await import('./server')
  return await createClient()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPublicSupabase(): any {
  const { createPublicClient } = require('./server')
  return createPublicClient()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPostCard(row: any): PostCardPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? '',
    category: row.category
      ? { name: row.category.name, slug: row.category.slug }
      : { name: '미분류', slug: 'uncategorized' },
    publishedAt: row.published_at ?? row.created_at,
    readTime: row.read_time_minutes ?? 5,
    thumbnail: row.featured_image ?? undefined,
  }
}

export interface PostDetailData {
  slug: string
  title: string
  excerpt: string
  content: string
  category: { name: string; slug: string }
  publishedAt: string
  readTime: number
  thumbnail?: string
  tags: string[]
  viewCount: number
}

export interface CategoryData {
  name: string
  slug: string
  description: string
  count: number
}

// ---- Published Posts ----

export async function getPublishedPosts(options?: {
  limit?: number
  offset?: number
  categorySlug?: string
  sort?: 'latest' | 'popular'
}): Promise<{ posts: PostCardPost[]; total: number }> {
  if (!isSupabaseConfigured()) {
    const { mockPosts, getPostsByCategory } = await import('@/lib/mock-data')
    let posts = options?.categorySlug
      ? getPostsByCategory(options.categorySlug)
      : [...mockPosts]

    if (options?.sort === 'popular') {
      posts.sort((a, b) => b.readTime - a.readTime)
    }

    const total = posts.length
    const offset = options?.offset ?? 0
    const limit = options?.limit ?? posts.length
    return { posts: posts.slice(offset, offset + limit), total }
  }

  const supabase = getPublicSupabase()

  let categoryId: string | undefined

  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .single()
    categoryId = cat?.id
    if (!categoryId) return { posts: [], total: 0 }
  }

  // Count query
  let countQ = supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
  if (categoryId) countQ = countQ.eq('category_id', categoryId)

  // Data query
  let dataQ = supabase
    .from('posts')
    .select('*, category:categories(name, slug)')
    .eq('status', 'published')
  if (categoryId) dataQ = dataQ.eq('category_id', categoryId)

  if (options?.sort === 'popular') {
    dataQ = dataQ.order('view_count', { ascending: false })
  } else {
    dataQ = dataQ.order('published_at', { ascending: false })
  }

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0
  dataQ = dataQ.range(offset, offset + limit - 1)

  const [{ data, error }, { count }] = await Promise.all([dataQ, countQ])

  if (error) {
    console.error('Error fetching posts:', error)
    return { posts: [], total: 0 }
  }

  return {
    posts: (data ?? []).map(toPostCard),
    total: count ?? 0,
  }
}

// ---- Single Post Detail ----

export async function getPostBySlug(
  slug: string
): Promise<PostDetailData | null> {
  if (!isSupabaseConfigured()) {
    const { mockPosts, mockPostDetails } = await import('@/lib/mock-data')
    const detail = mockPostDetails[slug]
    const basic = mockPosts.find((p) => p.slug === slug)

    if (!detail && !basic) return null

    const post = detail ?? {
      ...basic!,
      tags: [],
      relatedSlugs: [],
      content: basic!.excerpt,
    }
    return {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      publishedAt: post.publishedAt,
      readTime: post.readTime,
      tags: post.tags ?? [],
      viewCount: 0,
    }
  }

  const supabase = getPublicSupabase()

  const { data: post, error } = await supabase
    .from('posts')
    .select('*, category:categories(name, slug)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) return null

  // Get tags
  const { data: postTags } = await supabase
    .from('post_tags')
    .select('tag:tags(name)')
    .eq('post_id', post.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags = (postTags ?? [])
    .map((pt: any) => pt.tag?.name)
    .filter(Boolean) as string[]

  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? '',
    content: post.content ?? post.html_content ?? '',
    category: post.category ?? { name: '미분류', slug: 'uncategorized' },
    publishedAt: post.published_at ?? post.created_at,
    readTime: post.read_time_minutes ?? 5,
    thumbnail: post.featured_image ?? undefined,
    tags,
    viewCount: post.view_count,
  }
}

// ---- Related Posts ----

export async function getRelatedPosts(
  slug: string,
  categorySlug: string,
  limit = 3
): Promise<PostCardPost[]> {
  if (!isSupabaseConfigured()) {
    const { mockPosts } = await import('@/lib/mock-data')
    return mockPosts
      .filter((p) => p.slug !== slug && p.category.slug === categorySlug)
      .slice(0, limit)
  }

  const supabase = getPublicSupabase()

  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single()

  if (!cat) return []

  const { data } = await supabase
    .from('posts')
    .select('*, category:categories(name, slug)')
    .eq('status', 'published')
    .eq('category_id', cat.id)
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(toPostCard)
}

// ---- Categories ----

export async function getCategories(): Promise<CategoryData[]> {
  if (!isSupabaseConfigured()) {
    const { mockCategories } = await import('@/lib/mock-data')
    return mockCategories
  }

  const supabase = getPublicSupabase()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('post_count', { ascending: false })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return (data ?? []).map((c: any) => ({
    name: c.name,
    slug: c.slug,
    description: c.description ?? '',
    count: c.post_count,
  }))
}

// ---- Tags ----

export async function getTags(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [
      'ChatGPT', 'Next.js', 'React', 'TypeScript', 'AI', '머신러닝',
      '원격근무', '생산성', '스타트업', '디자인', 'Python', '클라우드',
      'DevOps', 'UX', '마케팅',
    ]
  }

  const supabase = getPublicSupabase()

  const { data } = await supabase
    .from('tags')
    .select('name')
    .order('post_count', { ascending: false })
    .limit(20)

  return (data ?? []).map((t: any) => t.name)
}

// ---- Popular Posts ----

export async function getPopularPosts(limit = 5): Promise<PostCardPost[]> {
  if (!isSupabaseConfigured()) {
    const { mockPosts } = await import('@/lib/mock-data')
    return mockPosts.slice(0, limit)
  }

  const supabase = getPublicSupabase()

  const { data } = await supabase
    .from('posts')
    .select('*, category:categories(name, slug)')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(limit)

  return (data ?? []).map(toPostCard)
}

// ---- Search ----

export async function searchPublishedPosts(
  query: string
): Promise<PostCardPost[]> {
  if (!isSupabaseConfigured()) {
    const { searchPosts } = await import('@/lib/mock-data')
    return searchPosts(query)
  }

  const supabase = getPublicSupabase()

  const searchTerm = `%${query}%`
  const { data } = await supabase
    .from('posts')
    .select('*, category:categories(name, slug)')
    .eq('status', 'published')
    .or(`title.ilike.${searchTerm},excerpt.ilike.${searchTerm}`)
    .order('published_at', { ascending: false })
    .limit(20)

  return (data ?? []).map(toPostCard)
}

// ---- Track Page View ----

export async function trackPageView(postSlug: string, path: string, headers?: {
  referrer?: string
  userAgent?: string
}): Promise<void> {
  if (!isSupabaseConfigured()) return

  const supabase = await getSupabase()

  // Get post id from slug
  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', postSlug)
    .single()

  if (!post) return

  // Insert page view
  await supabase.from('page_views').insert({
    post_id: post.id,
    path,
    referrer: headers?.referrer ?? null,
    user_agent: headers?.userAgent ?? null,
  })

  // Increment view count on post
  await supabase.rpc('increment_view_count', { post_slug: postSlug }).catch(() => {
    // Fallback: direct update if RPC doesn't exist
    supabase
      .from('posts')
      .update({ view_count: post.id ? undefined : 0 })
      .eq('id', post.id)
  })
}

// ---- Admin: All Posts (with all statuses) ----

export async function getAdminPosts(options?: {
  status?: string
  categoryId?: string
  search?: string
  limit?: number
  offset?: number
}): Promise<{
  posts: Array<{
    id: string
    title: string
    slug: string
    category: { name: string; slug: string } | null
    status: string
    created_at: string
    published_at: string | null
    view_count: number
  }>
  total: number
}> {
  if (!isSupabaseConfigured()) {
    // Return mock data shaped for admin
    const { mockPosts } = await import('@/lib/mock-data')
    const statuses = ['published', 'draft', 'scheduled', 'archived']
    const posts = mockPosts.map((p, i) => ({
      id: String(i + 1),
      title: p.title,
      slug: p.slug,
      category: p.category,
      status: statuses[i % 4],
      created_at: p.publishedAt,
      published_at: i % 4 === 0 ? p.publishedAt : null,
      view_count: Math.floor(Math.random() * 5000),
    }))

    let filtered = [...posts]
    if (options?.status && options.status !== 'all') {
      filtered = filtered.filter((p) => p.status === options.status)
    }
    if (options?.search) {
      const q = options.search.toLowerCase()
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(q))
    }

    const total = filtered.length
    const offset = options?.offset ?? 0
    const limit = options?.limit ?? filtered.length
    return { posts: filtered.slice(offset, offset + limit), total }
  }

  const supabase = await getSupabase()

  let countQ = supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })

  let dataQ = supabase
    .from('posts')
    .select('id, title, slug, status, created_at, published_at, view_count, category:categories(name, slug)')

  if (options?.status && options.status !== 'all') {
    dataQ = dataQ.eq('status', options.status)
    countQ = countQ.eq('status', options.status)
  }

  if (options?.categoryId) {
    dataQ = dataQ.eq('category_id', options.categoryId)
    countQ = countQ.eq('category_id', options.categoryId)
  }

  if (options?.search) {
    const searchTerm = `%${options.search}%`
    dataQ = dataQ.ilike('title', searchTerm)
    countQ = countQ.ilike('title', searchTerm)
  }

  dataQ = dataQ.order('created_at', { ascending: false })

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0
  dataQ = dataQ.range(offset, offset + limit - 1)

  const [{ data, error }, { count }] = await Promise.all([dataQ, countQ])

  if (error) {
    console.error('Error fetching admin posts:', error)
    return { posts: [], total: 0 }
  }

  return {
    posts: (data ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      category: p.category,
      status: p.status,
      created_at: p.created_at,
      published_at: p.published_at,
      view_count: p.view_count,
    })),
    total: count ?? 0,
  }
}

// ---- Admin: Dashboard Stats ----

export async function getDashboardStats(): Promise<{
  todayViews: number
  totalPublished: number
  pendingGeneration: number
  recentPosts: Array<{
    id: string
    title: string
    status: string
    created_at: string
    view_count: number
  }>
}> {
  if (!isSupabaseConfigured()) {
    return {
      todayViews: 1234,
      totalPublished: 156,
      pendingGeneration: 8,
      recentPosts: [
        { id: '1', title: 'ChatGPT로 생산성 10배 높이는 실전 프롬프트 모음', status: 'published', created_at: '2026-02-20', view_count: 3420 },
        { id: '2', title: '2026년 주목해야 할 AI 트렌드 총정리', status: 'published', created_at: '2026-02-18', view_count: 2180 },
        { id: '3', title: 'Next.js 16 App Router 완벽 가이드', status: 'draft', created_at: '2026-02-15', view_count: 0 },
        { id: '4', title: 'React 19 새로운 기능 한눈에 보기', status: 'scheduled', created_at: '2026-02-12', view_count: 0 },
        { id: '5', title: 'TypeScript 고급 패턴: 실무에서 바로 쓰는 타입 테크닉', status: 'published', created_at: '2026-02-10', view_count: 1890 },
      ],
    }
  }

  const supabase = await getSupabase()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: todayViews },
    { count: totalPublished },
    { count: pendingGeneration },
    { data: recentPosts },
  ] = await Promise.all([
    supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', today.toISOString()),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'draft'),
    supabase
      .from('posts')
      .select('id, title, status, created_at, view_count')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return {
    todayViews: todayViews ?? 0,
    totalPublished: totalPublished ?? 0,
    pendingGeneration: pendingGeneration ?? 0,
    recentPosts: (recentPosts ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      created_at: p.created_at,
      view_count: p.view_count,
    })),
  }
}

// ---- Settings ----

export async function getSettings(): Promise<Record<string, any>> {
  if (!isSupabaseConfigured()) {
    return {
      site_name: 'Blogwise',
      site_description: 'AI 기반 자동 블로그 시스템',
      site_url: 'https://blogwise.kr',
      posts_per_page: 10,
      default_language: 'ko',
      default_ai_provider: 'moonshot',
      max_tokens: 4000,
      crawl_interval_minutes: 60,
      crawl_max_items: 50,
      crawl_enabled: true,
      adsense_enabled: false,
      adsense_publisher_id: '',
    }
  }

  const supabase = await getSupabase()

  const { data } = await supabase.from('site_settings').select('key, value')

  const settings: Record<string, any> = {}
  for (const row of data ?? []) {
    settings[row.key] = row.value
  }
  return settings
}

export async function updateSettings(
  settings: Record<string, any>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true

  const supabase = await getSupabase()

  const upserts = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase.from('site_settings').upsert(upserts)

  if (error) {
    console.error('Error updating settings:', error)
    return false
  }
  return true
}
