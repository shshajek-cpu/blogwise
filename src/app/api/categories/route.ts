import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  try {
    if (!isConfigured) {
      return NextResponse.json({
        categories: [
          { id: '1', name: 'AI/ML', slug: 'ai-ml', description: 'AI와 머신러닝', color: '#6366f1', post_count: 12, created_at: new Date().toISOString() },
          { id: '2', name: '개발', slug: 'dev', description: '개발 관련', color: '#10b981', post_count: 8, created_at: new Date().toISOString() },
        ],
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const { data, error } = await db
      .from('categories')
      .select('*')
      .order('post_count', { ascending: false })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json({ error: '카테고리 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ categories: data ?? [] })
  } catch (err) {
    console.error('GET /api/categories error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isConfigured) {
      return NextResponse.json({ success: true, category: null })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const body = await request.json()
    const { name, slug, description, color } = body

    if (!name || !slug) {
      return NextResponse.json({ error: '이름과 슬러그는 필수입니다.' }, { status: 400 })
    }

    const { data: category, error } = await db
      .from('categories')
      .insert({ name, slug, description: description ?? null, color: color ?? null })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json({ error: '카테고리 생성 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ category }, { status: 201 })
  } catch (err) {
    console.error('POST /api/categories error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
