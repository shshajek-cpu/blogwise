import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MOCK_ITEMS = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  source_id: i % 2 === 0 ? '1' : '2',
  title: `모의 크롤링 아이템 ${i + 1}`,
  original_url: `https://example.com/item-${i + 1}`,
  original_content: `이것은 ${i + 1}번째 모의 크롤링 콘텐츠입니다.`,
  original_html: null as string | null,
  images: null as string[] | null,
  metadata: { keyword: ['블로그 수익화', '애드센스', 'SEO 최적화', '티스토리', '워드프레스'][i % 5] },
  is_used: i < 4,
  generated_post_id: null as string | null,
  crawled_at: new Date(Date.now() - i * 3600000).toISOString(),
}))

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source_id = searchParams.get('source_id')
    const is_used_param = searchParams.get('is_used')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const offset = (page - 1) * limit

    if (!isConfigured) {
      let items = [...MOCK_ITEMS]
      if (source_id) items = items.filter((item) => item.source_id === source_id)
      if (is_used_param !== null) {
        const isUsed = is_used_param === 'true'
        items = items.filter((item) => item.is_used === isUsed)
      }
      const total = items.length
      const paginated = items.slice(offset, offset + limit)
      return NextResponse.json({
        items: paginated,
        pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
        mock: true,
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    let query = db
      .from('crawled_items')
      .select('*', { count: 'exact' })
      .order('crawled_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (source_id) query = query.eq('source_id', source_id)
    if (is_used_param !== null) query = query.eq('is_used', is_used_param === 'true')

    const { data: items, error, count } = await query

    if (error) throw error

    const total = count ?? 0
    return NextResponse.json({
      items: items ?? [],
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Items GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '아이템 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
