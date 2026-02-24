import { NextRequest, NextResponse } from 'next/server'
import { runCrawlPipeline } from '@/lib/crawl/pipeline'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const MOCK_PIPELINE_RESULT = {
  trendsFound: 12,
  topicsAnalyzed: 12,
  highValueTopics: [
    {
      keyword: '정부지원금 신청방법',
      estimatedCPC: 1.9,
      competitionLevel: 'low',
      searchVolumeEstimate: 'very_high',
      revenuePotential: 87,
      suggestedTitle: '정부지원금 신청방법 완벽 가이드',
      suggestedCategory: '정부지원',
      longTailVariants: ['정부지원금 신청방법 방법', '정부지원금 신청방법 신청'],
    },
    {
      keyword: '소상공인 대출 조건',
      estimatedCPC: 3.75,
      competitionLevel: 'medium',
      searchVolumeEstimate: 'high',
      revenuePotential: 92,
      suggestedTitle: '소상공인 대출 조건 비교 추천 TOP 5',
      suggestedCategory: '금융',
      longTailVariants: ['소상공인 대출 조건 방법', '소상공인 대출 조건 신청'],
    },
  ],
  contentsCrawled: 0,
  errors: [],
  executionTimeMs: 3200,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      trendSources,
      maxTopics,
      minRevenueScore,
    }: {
      trendSources?: ('google' | 'naver' | 'daum')[]
      maxTopics?: number
      minRevenueScore?: number
    } = body

    if (!isConfigured) {
      return NextResponse.json({
        success: true,
        data: MOCK_PIPELINE_RESULT,
        mock: true,
      })
    }

    const result = await runCrawlPipeline({ trendSources, maxTopics, minRevenueScore })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Crawl API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '크롤링 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
