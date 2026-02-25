import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') ?? ''

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const result: Record<string, unknown> = {
    slug,
    slugLength: slug.length,
    slugCharCodes: slug.substring(0, 20).split('').map(c => c.charCodeAt(0)),
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
  }

  // Test 1: isSupabaseConfigured same logic as queries.ts
  result.isSupabaseConfigured = !!(supabaseUrl && supabaseKey)

  // Test 2: Call getPostBySlug from queries.ts (SAME code path as the page)
  try {
    const { getPostBySlug } = await import('@/lib/supabase/queries')
    const post = await getPostBySlug(slug)
    result.queriesGetPostBySlug = !!post
    result.queriesPostTitle = post?.title ?? null
  } catch (err) {
    result.queriesError = err instanceof Error ? err.stack : String(err)
  }

  // Test 3: Try with decodeURIComponent
  try {
    const decoded = decodeURIComponent(slug)
    result.decodedSlug = decoded
    result.decodedSlugLength = decoded.length
    result.slugMatchesDecoded = slug === decoded

    if (slug !== decoded) {
      const { getPostBySlug } = await import('@/lib/supabase/queries')
      const post = await getPostBySlug(decoded)
      result.decodedGetPostBySlug = !!post
      result.decodedPostTitle = post?.title ?? null
    }
  } catch (err) {
    result.decodeError = err instanceof Error ? err.message : String(err)
  }

  // Test 4: getPublicSupabase directly
  try {
    const { createPublicClient } = await import('@/lib/supabase/server')
    const supabase = createPublicClient()
    result.publicClientCreated = !!supabase

    const { data: post, error } = await supabase
      .from('posts')
      .select('id, title, slug, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    result.publicClientPostFound = !!post
    result.publicClientPostTitle = post?.title ?? null
    result.publicClientError = error?.message ?? null
  } catch (err) {
    result.publicClientException = err instanceof Error ? err.stack : String(err)
  }

  // Test 5: Direct Supabase client (bypass getPublicSupabase)
  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: post, error } = await supabase
        .from('posts')
        .select('id, title, slug, status')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      result.directPostFound = !!post
      result.directPostTitle = post?.title ?? null
      result.directError = error?.message ?? null
    } catch (err) {
      result.directException = err instanceof Error ? err.message : String(err)
    }
  }

  // Test 6: List all posts with their slugs
  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: allPosts } = await supabase
        .from('posts')
        .select('slug, status, title')
        .limit(10)

      result.allPosts = allPosts?.map(p => ({
        slug: p.slug,
        status: p.status,
        title: p.title?.substring(0, 30),
      })) ?? []
    } catch (err) {
      result.allPostsError = err instanceof Error ? err.message : String(err)
    }
  }

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
