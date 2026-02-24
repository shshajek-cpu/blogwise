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
        devices: [
          { name: 'mobile', count: 715, percentage: 58 },
          { name: 'desktop', count: 420, percentage: 34 },
          { name: 'tablet', count: 99, percentage: 8 },
        ],
        referrers: [
          { source: 'google', count: 641, percentage: 52 },
          { source: 'naver', count: 284, percentage: 23 },
          { source: 'direct', count: 148, percentage: 12 },
          { source: 'social', count: 123, percentage: 10 },
          { source: 'other', count: 38, percentage: 3 },
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
      { data: deviceData },
      { data: referrerData },
    ] = await Promise.all([
      db.from('page_views').select('*', { count: 'exact', head: true }).gte('viewed_at', today.toISOString()),
      db.from('page_views').select('*', { count: 'exact', head: true }).gte('viewed_at', periodStart.toISOString()),
      db.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      db.from('page_views').select('viewed_at').gte('viewed_at', periodStart.toISOString()).order('viewed_at', { ascending: true }),
      db.from('posts').select('id, title, slug, view_count').eq('status', 'published').order('view_count', { ascending: false }).limit(5),
      db.from('page_views').select('device_type').gte('viewed_at', periodStart.toISOString()),
      db.from('page_views').select('referrer').gte('viewed_at', periodStart.toISOString()),
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

    // Aggregate device types
    const deviceMap: Record<string, number> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (deviceData ?? []) as any[]) {
      const device = (row.device_type as string) || 'unknown'
      deviceMap[device] = (deviceMap[device] ?? 0) + 1
    }
    const totalDeviceViews = Object.values(deviceMap).reduce((sum, count) => sum + count, 0)
    const devices = Object.entries(deviceMap).map(([name, count]) => ({
      name,
      count,
      percentage: totalDeviceViews > 0 ? Math.round((count / totalDeviceViews) * 100) : 0,
    })).sort((a, b) => b.count - a.count)

    // Aggregate referrers with categorization
    const referrerMap: Record<string, number> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (referrerData ?? []) as any[]) {
      let source = 'direct'
      const ref = (row.referrer as string | null)

      if (ref && ref.trim()) {
        const refLower = ref.toLowerCase()
        if (refLower.includes('google')) {
          source = 'google'
        } else if (refLower.includes('naver')) {
          source = 'naver'
        } else if (refLower.includes('daum')) {
          source = 'daum'
        } else if (refLower.includes('facebook') || refLower.includes('twitter') || refLower.includes('instagram') || refLower.includes('linkedin') || refLower.includes('kakao')) {
          source = 'social'
        } else {
          source = 'other'
        }
      }

      referrerMap[source] = (referrerMap[source] ?? 0) + 1
    }
    const totalReferrerViews = Object.values(referrerMap).reduce((sum, count) => sum + count, 0)
    const referrers = Object.entries(referrerMap).map(([source, count]) => ({
      source,
      count,
      percentage: totalReferrerViews > 0 ? Math.round((count / totalReferrerViews) * 100) : 0,
    })).sort((a, b) => b.count - a.count)

    return NextResponse.json({
      todayViews: todayViews ?? 0,
      totalViews: totalViews ?? 0,
      publishedCount: publishedCount ?? 0,
      weeklyData,
      topPosts: topPosts ?? [],
      devices,
      referrers,
    })
  } catch (err) {
    console.error('GET /api/analytics error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
