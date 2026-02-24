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
        tags: [
          { id: '1', name: 'ChatGPT', slug: 'chatgpt', post_count: 10 },
          { id: '2', name: 'Next.js', slug: 'nextjs', post_count: 8 },
          { id: '3', name: 'React', slug: 'react', post_count: 7 },
          { id: '4', name: 'TypeScript', slug: 'typescript', post_count: 6 },
          { id: '5', name: 'AI', slug: 'ai', post_count: 5 },
        ],
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const { data, error } = await db
      .from('tags')
      .select('*')
      .order('post_count', { ascending: false })

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json({ error: '태그 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ tags: data ?? [] })
  } catch (err) {
    console.error('GET /api/tags error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isConfigured) {
      return NextResponse.json({ success: true, tag: null })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json({ error: '이름과 슬러그는 필수입니다.' }, { status: 400 })
    }

    const { data: tag, error } = await db
      .from('tags')
      .insert({ name, slug })
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return NextResponse.json({ error: '태그 생성 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ tag }, { status: 201 })
  } catch (err) {
    console.error('POST /api/tags error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
