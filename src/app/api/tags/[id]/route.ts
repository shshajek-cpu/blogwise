import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isConfigured) {
      return NextResponse.json({ success: true, tag: null })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const body = await request.json()

    const allowedFields = ['name', 'slug']
    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '업데이트할 필드가 없습니다.' }, { status: 400 })
    }

    const { data: tag, error } = await db
      .from('tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !tag) {
      console.error('Error updating tag:', error)
      return NextResponse.json({ error: '태그 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ tag })
  } catch (err) {
    console.error('PATCH /api/tags/[id] error:', err)
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    // Clean up post_tags associations first
    await db.from('post_tags').delete().eq('tag_id', id)

    const { error } = await db.from('tags').delete().eq('id', id)

    if (error) {
      console.error('Error deleting tag:', error)
      return NextResponse.json({ error: '태그 삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/tags/[id] error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
