import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) {
    return 'mobile'
  }
  if (/tablet|ipad/.test(ua)) {
    return 'tablet'
  }
  return 'desktop'
}

export async function POST(request: NextRequest) {
  try {
    if (!isConfigured) {
      return NextResponse.json({ success: true })
    }

    const body = await request.json()
    const { path, post_id, referrer, session_id } = body

    if (!path) {
      return NextResponse.json({ error: 'path는 필수입니다.' }, { status: 400 })
    }

    const userAgent = request.headers.get('user-agent') ?? ''
    const device_type = getDeviceType(userAgent)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const { error: viewError } = await db.from('page_views').insert({
      path,
      post_id: post_id ?? null,
      referrer: referrer ?? null,
      user_agent: userAgent || null,
      device_type,
      session_id: session_id ?? null,
    })

    if (viewError) {
      console.error('Error inserting page view:', viewError)
    }

    if (post_id) {
      // Try atomic increment via RPC first, fall back to read-modify-write
      const { error: rpcError } = await db.rpc('increment_view_count', { row_id: post_id })

      if (rpcError) {
        // RPC not available — fallback to read-modify-write
        // NOTE: This is NOT atomic and may lose increments under concurrent writes.
        // For a proper fix, create an SQL function: increment_view_count(row_id uuid)
        const { data: postRow } = await db
          .from('posts')
          .select('view_count')
          .eq('id', post_id)
          .single()

        if (postRow) {
          await db
            .from('posts')
            .update({ view_count: ((postRow as { view_count: number }).view_count ?? 0) + 1 })
            .eq('id', post_id)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/analytics/track error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
