import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request: NextRequest) {
  // Validate cron secret
  // Accept either Vercel cron header or query param secret
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const secret = request.nextUrl.searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET

  if (!isVercelCron && (!cronSecret || secret !== cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!isConfigured) {
      return NextResponse.json({ published: 0 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const now = new Date().toISOString()

    const { data: posts, error: fetchError } = await db
      .from('posts')
      .select('id')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)

    if (fetchError) {
      console.error('[cron/publish] Error fetching scheduled posts:', fetchError)
      return NextResponse.json({ error: '예약 포스트 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    if (!posts || posts.length === 0) {
      console.log('[cron/publish] No scheduled posts to publish.')
      return NextResponse.json({ published: 0 })
    }

    const ids = posts.map((p: { id: string }) => p.id)

    const { error: updateError } = await db
      .from('posts')
      .update({ status: 'published', published_at: now })
      .in('id', ids)

    if (updateError) {
      console.error('[cron/publish] Error publishing scheduled posts:', updateError)
      return NextResponse.json({ error: '예약 포스트 발행 중 오류가 발생했습니다.' }, { status: 500 })
    }

    revalidatePath('/')
    revalidatePath('/posts')

    console.log(`[cron/publish] Published ${ids.length} scheduled post(s).`)
    return NextResponse.json({ published: ids.length })
  } catch (err) {
    console.error('[cron/publish] Fatal error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
