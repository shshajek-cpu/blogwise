import { NextRequest, NextResponse } from 'next/server'
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
      return NextResponse.json(
        { error: '포스트를 찾을 수 없습니다.' },
        { status: 404 }
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

    // Handle scheduled_at field
    if (body.scheduled_at) {
      body.scheduled_at = new Date(body.scheduled_at).toISOString()
    }

    // Handle published_at field
    if (body.status === 'published' && !body.published_at) {
      body.published_at = new Date().toISOString()
    }

    const { data: post, error } = await db
      .from('posts')
      .update(body)
      .eq('id', id)
      .select('*, category:categories(id, name, slug, description, color, post_count, created_at)')
      .single()

    if (error) {
      console.error('Error updating post:', error)
      return NextResponse.json(
        { error: '포스트 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      )
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

    const { error } = await db.from('posts').delete().eq('id', id)

    if (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json(
        { error: '포스트 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/posts/[id] error:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
