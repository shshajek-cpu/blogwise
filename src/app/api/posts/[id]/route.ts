import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    if (!isConfigured) {
      return NextResponse.json({ post: null })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const { data: post, error } = await db
      .from('posts')
      .select('*, category:categories(id, name, slug, description, color, post_count, created_at)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching post:', error)
      const status = error.code === 'PGRST116' ? 404 : 500
      const message = error.code === 'PGRST116'
        ? '포스트를 찾을 수 없습니다.'
        : '서버 오류가 발생했습니다.'
      return NextResponse.json(
        { error: message },
        { status }
      )
    }

    return NextResponse.json({ post })
  } catch (err) {
    console.error('GET /api/posts/[id] error:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    if (!isConfigured) {
      return NextResponse.json({ success: true })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const body = await request.json()

    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = [
      'title', 'content', 'excerpt', 'status', 'slug', 'category_id',
      'featured_image', 'seo_title', 'seo_description', 'seo_keywords',
      'published_at', 'scheduled_at', 'ai_provider', 'source_url'
    ]
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }

    // Handle scheduled_at field
    if (updateData.scheduled_at) {
      updateData.scheduled_at = new Date(updateData.scheduled_at as string).toISOString()
    }

    // Handle published_at field
    if (updateData.status === 'published' && !updateData.published_at) {
      updateData.published_at = new Date().toISOString()
    }

    const { data: post, error } = await db
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select('*, category:categories(id, name, slug, description, color, post_count, created_at)')
      .single()

    if (error) {
      console.error('Error updating post:', error)
      const status = error.code === 'PGRST116' ? 404 : 500
      const message = error.code === 'PGRST116'
        ? '포스트를 찾을 수 없습니다.'
        : '포스트 업데이트 중 오류가 발생했습니다.'
      return NextResponse.json(
        { error: message },
        { status }
      )
    }

    // Revalidate static pages when post is published or status changes
    if (body.status === 'published' || body.status) {
      revalidatePath('/')
      revalidatePath('/posts')
      revalidatePath(`/posts/${post.slug}`)
      if (post.category?.slug) {
        revalidatePath(`/category/${post.category.slug}`)
      }
    }

    return NextResponse.json({ post })
  } catch (err) {
    console.error('PATCH /api/posts/[id] error:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    if (!isConfigured) {
      return NextResponse.json({ success: true })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    // Delete related records first (FK constraints may lack CASCADE)
    const { error: logsErr } = await db.from('ai_generation_logs').delete().eq('post_id', id)
    if (logsErr) console.error('Error deleting ai_generation_logs:', logsErr)

    const { error: crawlErr } = await db.from('crawled_items').update({ generated_post_id: null }).eq('generated_post_id', id)
    if (crawlErr) console.error('Error clearing crawled_items ref:', crawlErr)

    const { error, count } = await db.from('posts').delete().eq('id', id).select('id', { count: 'exact', head: true })

    if (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json(
        { error: '포스트 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, deleted: count })
  } catch (err) {
    console.error('DELETE /api/posts/[id] error:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
