import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isConfigured) {
      return NextResponse.json({ post: null })
    }

    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    const { data: post, error } = await db
      .from('posts')
      .select('*, category:categories(id, name, slug, description, color, post_count, created_at)')
      .eq('id', id)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: '포스트를 찾을 수 없습니다.' }, { status: 404 })
    }

    const { data: postTags } = await db
      .from('post_tags')
      .select('tag:tags(id, name, slug, post_count)')
      .eq('post_id', id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tags = (postTags ?? []).map((pt: any) => pt.tag).filter(Boolean)

    return NextResponse.json({ post: { ...post, tags } })
  } catch (err) {
    console.error('GET /api/posts/[id] error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isConfigured) {
      return NextResponse.json({ success: true, post: null })
    }

    // Use admin client to bypass RLS for admin operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const body = await request.json()
    const { tag_ids, ...postInput } = body

    if (postInput.status === 'published' && !postInput.published_at) {
      postInput.published_at = new Date().toISOString()
    }
    postInput.updated_at = new Date().toISOString()

    const { data: post, error } = await db
      .from('posts')
      .update(postInput)
      .eq('id', id)
      .select('*, category:categories(id, name, slug, description, color, post_count, created_at)')
      .single()

    if (error || !post) {
      console.error('Error updating post:', error)
      return NextResponse.json({ error: '포스트 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
    }

    if (tag_ids !== undefined && Array.isArray(tag_ids)) {
      await db.from('post_tags').delete().eq('post_id', id)
      if (tag_ids.length > 0) {
        const tagRows = tag_ids.map((tag_id: string) => ({ post_id: id, tag_id }))
        const { error: tagError } = await db.from('post_tags').insert(tagRows)
        if (tagError) {
          console.error('Error updating post tags:', tagError)
        }
      }
    }

    const { data: postTags } = await db
      .from('post_tags')
      .select('tag:tags(id, name, slug, post_count)')
      .eq('post_id', id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tags = (postTags ?? []).map((pt: any) => pt.tag).filter(Boolean)

    return NextResponse.json({ post: { ...post, tags } })
  } catch (err) {
    console.error('PATCH /api/posts/[id] error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isConfigured) {
      return NextResponse.json({ success: true })
    }

    // Use admin client to bypass RLS for admin operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    // Clear foreign key references that don't have ON DELETE CASCADE
    await Promise.all([
      db.from('post_tags').delete().eq('post_id', id),
      db.from('crawled_items').update({ generated_post_id: null, is_used: false }).eq('generated_post_id', id),
      db.from('ai_generation_logs').update({ post_id: null }).eq('post_id', id),
    ])

    const { error } = await db.from('posts').delete().eq('id', id)
    if (error) {
      console.error('Error deleting post:', error)
      return NextResponse.json({ error: '포스트 삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/posts/[id] error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
