import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function getPeriodStart(period: string): Date {
  const now = new Date()
  switch (period) {
    case '90d':
      now.setDate(now.getDate() - 90)
      break
    case '30d':
      now.setDate(now.getDate() - 30)
      break
    case '7d':
    default:
      now.setDate(now.getDate() - 7)
      break
  }
  now.setHours(0, 0, 0, 0)
  return now
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') ?? '7d'

    if (!isConfigured) {
      const days = parseInt(period.replace('d', ''), 10) || 7
      const weeklyData = Array.from({ length: days }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (days - 1 - i))
        return {
          date: d.toISOString().split('T')[0],
          views: Math.floor(Math.random() * 500) + 100,
        }
      })

      return NextResponse.json({
        todayViews: 1234,
        totalViews: 58320,
        publishedCount: 156,
        weeklyData,
        topPosts: [
          { id: '1', title: 'ChatGPT로 생산성 10배 높이는 실전 프롬프트 모음', slug: 'chatgpt-prompts', view_count: 3420 },
          { id: '2', title: '2026년 주목해야 할 AI 트렌드 총정리', slug: 'ai-trends-2026', view_count: 2180 },
          { id: '3', title: 'Next.js 16 App Router 완벽 가이드', slug: 'nextjs-16-guide', view_count: 1890 },
        ],
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const periodStart = getPeriodStart(period)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      { count: todayViews },
      { count: totalViews },
      { count: publishedCount },
      { data: viewsByDay },
      { data: topPosts },
    ] = await Promise.all([
      db.from('page_views').select('*', { count: 'exact', head: true }).gte('viewed_at', today.toISOString()),
      db.from('page_views').select('*', { count: 'exact', head: true }).gte('viewed_at', periodStart.toISOString()),
      db.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      db.from('page_views').select('viewed_at').gte('viewed_at', periodStart.toISOString()).order('viewed_at', { ascending: true }),
      db.from('posts').select('id, title, slug, view_count').eq('status', 'published').order('view_count', { ascending: false }).limit(5),
    ])

    const dayMap: Record<string, number> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (viewsByDay ?? []) as any[]) {
      const day = (row.viewed_at as string).split('T')[0]
      dayMap[day] = (dayMap[day] ?? 0) + 1
    }

    const days = parseInt(period.replace('d', ''), 10) || 7
    const weeklyData = Array.from({ length: days }, (_, i) => {
      const d = new Date(periodStart)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      return { date: dateStr, views: dayMap[dateStr] ?? 0 }
    })

    return NextResponse.json({
      todayViews: todayViews ?? 0,
      totalViews: totalViews ?? 0,
      publishedCount: publishedCount ?? 0,
      weeklyData,
      topPosts: topPosts ?? [],
    })
  } catch (err) {
    console.error('GET /api/analytics error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
