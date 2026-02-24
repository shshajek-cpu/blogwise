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
      return NextResponse.json({ success: true, category: null })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const body = await request.json()

    const { data: category, error } = await db
      .from('categories')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error || !category) {
      console.error('Error updating category:', error)
      return NextResponse.json({ error: '카테고리 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ category })
  } catch (err) {
    console.error('PATCH /api/categories/[id] error:', err)
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

    const { count } = await db
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: `이 카테고리에 포스트 ${count}개가 연결되어 있어 삭제할 수 없습니다.` },
        { status: 409 }
      )
    }

    const { error } = await db.from('categories').delete().eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return NextResponse.json({ error: '카테고리 삭제 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/categories/[id] error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
