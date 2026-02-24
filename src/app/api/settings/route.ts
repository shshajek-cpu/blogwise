import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const mockSettings = {
  site_name: 'Blogwise',
  site_description: 'AI 기반 자동 블로그 시스템',
  site_url: 'https://blogwise.kr',
  posts_per_page: 10,
  default_language: 'ko',
  default_ai_provider: 'moonshot',
  max_tokens: 4000,
  crawl_interval_minutes: 60,
  crawl_max_items: 50,
  crawl_enabled: true,
  adsense_enabled: false,
  adsense_publisher_id: '',
}

export async function GET() {
  try {
    if (!isConfigured) {
      return NextResponse.json({ settings: mockSettings })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const { data, error } = await db
      .from('site_settings')
      .select('key, value')

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: '설정 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    const settings: Record<string, unknown> = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (data ?? []) as any[]) {
      settings[row.key] = row.value
    }

    return NextResponse.json({ settings })
  } catch (err) {
    console.error('GET /api/settings error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isConfigured) {
      return NextResponse.json({ success: true })
    }

    const body = await request.json()

    if (typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: '올바른 설정 형식이 아닙니다.' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const upserts = Object.entries(body).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await db
      .from('site_settings')
      .upsert(upserts, { onConflict: 'key' })

    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json({ error: '설정 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PUT /api/settings error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
