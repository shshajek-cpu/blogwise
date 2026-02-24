import { NextRequest, NextResponse } from 'next/server'
import { getAllTrends, TrendingTopic } from '@/lib/crawl/trends'
import { rankTopicsByRevenue, KeywordAnalysis } from '@/lib/crawl/analyzer'

const MOCK_TRENDS: TrendingTopic[] = [
  {
    keyword: '정부지원금 신청방법',
    source: 'google',
    category: '정부지원',
    trendScore: 90,
    relatedKeywords: ['정부지원금 신청방법 방법', '정부지원금 신청방법 신청', '정부지원금 신청방법 조건'],
    fetchedAt: new Date().toISOString(),
  },
  {
    keyword: '소상공인 대출 조건',
    source: 'naver',
    category: '금융',
    trendScore: 85,
    relatedKeywords: ['소상공인 대출 조건 방법', '소상공인 대출 조건 신청', '소상공인 대출 조건 조건'],
    fetchedAt: new Date().toISOString(),
  },
  {
    keyword: '실업급여 신청 자격',
    source: 'daum',
    category: '정부지원',
    trendScore: 80,
    relatedKeywords: ['실업급여 신청 자격 방법', '실업급여 신청 자격 신청', '실업급여 신청 자격 조건'],
    fetchedAt: new Date().toISOString(),
  },
  {
    keyword: '건강보험 환급금 조회',
    source: 'google',
    category: '건강',
    trendScore: 75,
    relatedKeywords: ['건강보험 환급금 조회 방법', '건강보험 환급금 조회 신청', '건강보험 환급금 조회 조건'],
    fetchedAt: new Date().toISOString(),
  },
  {
    keyword: '자동차보험 비교 추천',
    source: 'naver',
    category: '보험',
    trendScore: 70,
    relatedKeywords: ['자동차보험 비교 추천 방법', '자동차보험 비교 추천 신청', '자동차보험 비교 추천 조건'],
    fetchedAt: new Date().toISOString(),
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sourcesParam = searchParams.get('sources')
    const limitParam = searchParams.get('limit')
    const analyze = searchParams.get('analyze') === 'true'
    const typeFilter = searchParams.get('type') // 'all' | 'trending' | 'evergreen' | 'seasonal'

    const sources = sourcesParam
      ? sourcesParam.split(',').map((s) => s.trim())
      : undefined
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    let trends: TrendingTopic[]
    let analyzed: KeywordAnalysis[] | undefined

    try {
      trends = await getAllTrends()

      // Filter by keyword type
      if (typeFilter && typeFilter !== 'all') {
        trends = trends.filter((t) => {
          if (typeFilter === 'trending') return !t.keywordType || t.keywordType === 'trending'
          return t.keywordType === typeFilter
        })
      }

      // Filter by requested sources
      if (sources && sources.length > 0) {
        trends = trends.filter((t) => sources.includes(t.source))
      }

      // Apply limit
      if (limit && limit > 0) {
        trends = trends.slice(0, limit)
      }
    } catch {
      // getAllTrends failed — return mock data
      let mockSlice = limit ? MOCK_TRENDS.slice(0, limit) : MOCK_TRENDS
      if (sources && sources.length > 0) {
        mockSlice = mockSlice.filter((t) => sources.includes(t.source))
      }

      if (analyze) {
        const ranked = await rankTopicsByRevenue(mockSlice).catch(() => [] as KeywordAnalysis[])
        return NextResponse.json({ trends: mockSlice, analyzed: ranked, mock: true })
      }

      return NextResponse.json({ trends: mockSlice, mock: true })
    }

    if (analyze) {
      analyzed = await rankTopicsByRevenue(trends)
      return NextResponse.json({ trends, analyzed })
    }

    return NextResponse.json({ trends })
  } catch (error) {
    console.error('Trends API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '트렌드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
