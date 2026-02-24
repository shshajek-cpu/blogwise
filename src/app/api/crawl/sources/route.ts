import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MOCK_SOURCES = [
  {
    id: '1',
    name: 'Google Trends Korea',
    platform: 'generic',
    url: 'https://trends.google.com/trends/?geo=KR',
    crawl_frequency: '3600',
    is_active: true,
    last_crawled_at: null as string | null,
    total_items: 42,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    unused_items: 18,
  },
  {
    id: '2',
    name: 'Naver 블로그',
    platform: 'naver_blog',
    url: 'https://blog.naver.com',
    crawl_frequency: '1800',
    is_active: true,
    last_crawled_at: null as string | null,
    total_items: 35,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    unused_items: 12,
  },
  {
    id: '3',
    name: 'Tistory 인기글',
    platform: 'tistory',
    url: 'https://www.tistory.com',
    crawl_frequency: '7200',
    is_active: false,
    last_crawled_at: null as string | null,
    total_items: 10,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    unused_items: 10,
  },
]

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export async function GET() {
  try {
    if (!isConfigured) {
      return NextResponse.json({ sources: MOCK_SOURCES, mock: true })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const { data: sources, error } = await db
      .from('crawl_sources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sources: sources ?? [] })
  } catch (error) {
    console.error('Sources GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '소스 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      platform,
      url,
      crawl_frequency,
      is_active,
    }: {
      name: string
      platform: string
      url: string
      crawl_frequency?: string | null
      is_active?: boolean
    } = body

    if (!name || !platform || !url) {
      return NextResponse.json(
        { error: '이름, 플랫폼, URL은 필수입니다.' },
        { status: 400 }
      )
    }

    if (!isValidUrl(url)) {
      return NextResponse.json({ error: '올바른 URL 형식이 아닙니다.' }, { status: 400 })
    }

    if (!isConfigured) {
      const mockNew = {
        id: String(Date.now()),
        name,
        platform,
        url,
        crawl_frequency: crawl_frequency ?? '3600',
        is_active: is_active ?? true,
        last_crawled_at: null,
        total_items: 0,
        created_at: new Date().toISOString(),
      }
      return NextResponse.json({ source: mockNew, mock: true }, { status: 201 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const { data: source, error } = await db
      .from('crawl_sources')
      .insert({
        name,
        platform,
        url,
        crawl_frequency: crawl_frequency ?? null,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ source }, { status: 201 })
  } catch (error) {
    console.error('Sources POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '소스 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
