import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)), 100)
    const sort = searchParams.get('sort') ?? 'created_at'

    if (!isConfigured) {
      return NextResponse.json({ posts: [], total: 0, page, limit })
    }

    // Use admin client to bypass RLS — admin page needs all statuses
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    let dataQ = db
      .from('posts')
      .select('*, category:categories(id, name, slug, description, color, post_count, created_at)')

    let countQ = db
      .from('posts')
      .select('*', { count: 'exact', head: true })

    if (status && status !== 'all') {
      dataQ = dataQ.eq('status', status)
      countQ = countQ.eq('status', status)
    }

    if (category) {
      dataQ = dataQ.eq('category_id', category)
      countQ = countQ.eq('category_id', category)
    }

    if (search) {
      const escaped = search.replace(/[%_\\]/g, '\\$&')
      const term = `%${escaped}%`
      dataQ = dataQ.or(`title.ilike.${term},excerpt.ilike.${term}`)
      countQ = countQ.or(`title.ilike.${term},excerpt.ilike.${term}`)
    }

    if (sort === 'popular') {
      dataQ = dataQ.order('view_count', { ascending: false })
    } else if (sort === 'published_at') {
      dataQ = dataQ.order('published_at', { ascending: false })
    } else {
      dataQ = dataQ.order('created_at', { ascending: false })
    }

    const offset = (page - 1) * limit
    dataQ = dataQ.range(offset, offset + limit - 1)

    const [{ data, error }, { count }] = await Promise.all([dataQ, countQ])

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ error: '포스트 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // Count by status for tab badges
    const [
      { count: publishedCount },
      { count: draftCount },
      { count: scheduledCount },
      { count: archivedCount },
    ] = await Promise.all([
      db.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      db.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      db.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
      db.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
    ])

    return NextResponse.json({
      posts: data ?? [],
      total: count ?? 0,
      page,
      limit,
      counts: {
        total: count ?? 0,
        published: publishedCount ?? 0,
        draft: draftCount ?? 0,
        scheduled: scheduledCount ?? 0,
        archived: archivedCount ?? 0,
      },
    })
  } catch (err) {
    console.error('GET /api/posts error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isConfigured) {
      return NextResponse.json({ success: true, post: null })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const body = await request.json()
    const { tag_ids, tags: tagNames, ...postInput } = body

    if (!postInput.slug && postInput.title) {
      postInput.slug = slugify(postInput.title)
    }

    if (postInput.status === 'published' && !postInput.published_at) {
      postInput.published_at = new Date().toISOString()
    }

    // Support scheduled_at field
    if (postInput.scheduled_at) {
      postInput.scheduled_at = new Date(postInput.scheduled_at).toISOString()
    }

    const { data: post, error } = await db
      .from('posts')
      .insert(postInput)
      .select('*, category:categories(id, name, slug, description, color, post_count, created_at)')
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return NextResponse.json({ error: '포스트 생성 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // Resolve tag names to IDs (upsert by name)
    let resolvedTagIds: string[] = tag_ids && Array.isArray(tag_ids) ? [...tag_ids] : []
    if (tagNames && Array.isArray(tagNames) && tagNames.length > 0) {
      for (const name of tagNames) {
        const trimmed = (name as string).trim()
        if (!trimmed) continue
        const tagSlug = trimmed.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
        // Try to find existing tag
        const { data: existing } = await db.from('tags').select('id').eq('name', trimmed).single()
        if (existing) {
          resolvedTagIds.push(existing.id)
        } else {
          // Create new tag
          const { data: newTag } = await db.from('tags').insert({ name: trimmed, slug: tagSlug }).select('id').single()
          if (newTag) resolvedTagIds.push(newTag.id)
        }
      }
    }

    if (resolvedTagIds.length > 0) {
      const tagRows = resolvedTagIds.map((tag_id: string) => ({ post_id: post.id, tag_id }))
      const { error: tagError } = await db.from('post_tags').insert(tagRows)
      if (tagError) {
        console.error('Error inserting post tags:', tagError)
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    console.error('POST /api/posts error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
