import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { crawlSingleSource } from '@/lib/crawl/pipeline'

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

    const body = await request.json()

    if (!isConfigured) {
      return NextResponse.json({
        source: { id, ...body, updated_at: new Date().toISOString() },
        mock: true,
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    const { data: source, error } = await db
      .from('crawl_sources')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ source })
  } catch (error) {
    console.error('Source PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '소스 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isConfigured) {
      return NextResponse.json({ success: true, deleted_id: id, mock: true })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    // Delete associated crawled_items first
    const { error: itemsError } = await db
      .from('crawled_items')
      .delete()
      .eq('source_id', id)

    if (itemsError) throw itemsError

    const { error: sourceError } = await db
      .from('crawl_sources')
      .delete()
      .eq('id', id)

    if (sourceError) throw sourceError

    return NextResponse.json({ success: true, deleted_id: id })
  } catch (error) {
    console.error('Source DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '소스 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isConfigured) {
      return NextResponse.json({
        success: true,
        source_id: id,
        items_found: 1,
        items_saved: 1,
        errors: [],
        crawled_at: new Date().toISOString(),
        mock: true,
      })
    }

    // crawlSingleSource returns CrawlResult: { source_id, items_found, items_saved, errors, crawled_at }
    const result = await crawlSingleSource(id)

    return NextResponse.json({
      success: result.errors.length === 0,
      ...result,
    })
  } catch (error) {
    console.error('Source crawl POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '크롤링 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
