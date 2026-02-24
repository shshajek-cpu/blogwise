// Trend Detection Engine - finds trending topics in Korea
// Sources: Google Trends KR, Naver, Daum

import { getAllEvergreenKeywords, type KeywordType } from './evergreen'

export interface TrendingTopic {
  keyword: string
  source: 'google' | 'naver' | 'daum' | 'evergreen'
  category?: string
  searchVolume?: number // estimated
  trendScore: number    // 0-100
  relatedKeywords: string[]
  fetchedAt: string
  keywordType?: KeywordType  // NEW: 'evergreen' | 'seasonal' | 'trending'
  reason?: string            // NEW: why this keyword is recommended
}

const USER_AGENT = 'Blogwise-Bot/1.0'

// High-CPC fallback topics by category when APIs are unavailable
const FALLBACK_TOPICS: Array<{ keyword: string; category: string; score: number }> = [
  { keyword: '정부지원금 신청방법', category: '정부지원', score: 90 },
  { keyword: '소상공인 대출 조건', category: '금융', score: 88 },
  { keyword: '실업급여 신청 자격', category: '정부지원', score: 85 },
  { keyword: '청년 주택청약 방법', category: '부동산', score: 83 },
  { keyword: '건강보험 환급금 조회', category: '건강', score: 82 },
  { keyword: '연말정산 환급금 조회', category: '금융', score: 80 },
  { keyword: '자동차보험 비교 추천', category: '보험', score: 78 },
  { keyword: '신용대출 금리 비교', category: '금융', score: 77 },
  { keyword: '종합소득세 신고 방법', category: '금융', score: 75 },
  { keyword: '운전면허 갱신 방법', category: '생활정보', score: 73 },
  { keyword: '국민연금 수령나이', category: '금융', score: 72 },
  { keyword: '부동산 취득세 계산', category: '부동산', score: 70 },
  { keyword: '주식 양도소득세 신고', category: '금융', score: 68 },
  { keyword: '건강검진 예약 방법', category: '건강', score: 65 },
  { keyword: '전월세 계약서 작성', category: '부동산', score: 63 },
]

// Category keyword map for auto-detection
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '금융': ['대출', '금리', '투자', '주식', '코인', '비트코인', '증시', '환율', '은행', '카드', '보험료', '연금', '적금', '예금', '재테크'],
  '부동산': ['아파트', '전세', '월세', '부동산', '청약', '분양', '매매', '임대', '집값', '주택'],
  '정부지원': ['지원금', '보조금', '실업급여', '국민연금', '건강보험', '정부', '복지', '수당', '바우처'],
  '건강': ['건강', '다이어트', '운동', '영양', '병원', '의료', '검진', '비타민', '헬스', '약'],
  'IT/기술': ['AI', '인공지능', 'ChatGPT', '앱', '스마트폰', '갤럭시', '아이폰', '컴퓨터', '노트북', '게임', '소프트웨어'],
  '생활정보': ['면허', '여권', '주민등록', '전화번호', '택배', '배송', '예약', '신청', '발급'],
  '교육': ['수능', '대학', '시험', '자격증', '학원', '공부', '학교', '입학'],
  '연예/문화': ['드라마', '영화', '연예', '아이돌', 'K-pop', '배우', '가수', '넷플릭스', '공연'],
  '스포츠': ['축구', '야구', '농구', 'KBO', 'EPL', '올림픽', '손흥민', '이강인'],
}

const LOW_VALUE_PATTERNS: string[] = [
  '날씨', '기온', '미세먼지', '일기예보', '기상',
  '지진', '태풍', '폭우', '폭설', '한파',
  '오늘의', '내일의', '이번주',
  '스코어', '경기결과', '하이라이트',
  '사망', '사고', '속보', '긴급',
  '실시간', '생중계', '라이브',
  '맑음', '흐림', '비', '눈',
  'vs', 'VS',
]

/**
 * Returns true if a keyword is considered low-value for blog monetization.
 * Filters weather, breaking news, live scores, and other transient queries.
 */
function isLowValueKeyword(keyword: string): boolean {
  const lower = keyword.toLowerCase()
  // Check against blacklist
  if (LOW_VALUE_PATTERNS.some(p => lower.includes(p))) return true
  // Too short keywords (1-2 chars) are usually low value
  if (keyword.replace(/\s/g, '').length <= 2) return true
  return false
}

/**
 * Score a keyword 0-100 based on monetization potential.
 * Higher scores = better blog traffic value and ad revenue.
 */
function calculateKeywordQuality(keyword: string): number {
  let score = 50 // base score

  // Boost for high-CPC category match
  const category = detectCategory(keyword)
  if (category) {
    const highCPC = ['금융', '부동산', '정부지원', '건강', '법률']
    if (highCPC.includes(category)) score += 30
    else score += 15
  }

  // Boost for actionable keywords
  const actionWords = ['방법', '신청', '조건', '추천', '비교', '가격', '후기', '가이드', '총정리', '하는법']
  if (actionWords.some(w => keyword.includes(w))) score += 15

  // Penalty for low-value patterns
  if (isLowValueKeyword(keyword)) score -= 60

  // Boost for longer, more specific keywords (long-tail)
  const wordCount = keyword.split(/\s+/).length
  if (wordCount >= 3) score += 10
  if (wordCount >= 4) score += 5

  return Math.max(0, Math.min(100, score))
}

/**
 * Detect a category for a keyword based on known keyword lists.
 */
function detectCategory(keyword: string): string | undefined {
  const lower = keyword.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return category
    }
  }
  return undefined
}

/**
 * Parse a simple XML/RSS string and extract text content from named tags.
 * Uses regex since DOMParser is not available in Node.js server environment.
 */
function extractXmlValues(xml: string, tagName: string): string[] {
  const results: string[] = []
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi')
  let match: RegExpExecArray | null
  while ((match = pattern.exec(xml)) !== null) {
    const value = match[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (value) results.push(value)
  }
  return results
}

/**
 * Fetch Google Trends Korea RSS and parse trending topics.
 * Endpoint: https://trends.google.co.kr/trending/rss?geo=KR
 */
export async function fetchGoogleTrends(): Promise<TrendingTopic[]> {
  const fetchedAt = new Date().toISOString()
  try {
    console.log('[trends] Fetching Google Trends KR...')
    const res = await fetch('https://trends.google.co.kr/trending/rss?geo=KR', {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const xml = await res.text()
    const titles = extractXmlValues(xml, 'title').slice(1) // skip channel title
    const relatedNodes = extractXmlValues(xml, 'ht:approx_traffic')

    const topics: TrendingTopic[] = titles.map((keyword, i) => {
      const trafficStr = relatedNodes[i] ?? ''
      const trafficNum = parseInt(trafficStr.replace(/[^0-9]/g, ''), 10) || 0
      // Log-normalized score: more meaningful spread across traffic volumes
      const trendScore = trafficNum > 0
        ? Math.min(100, Math.round(Math.log10(trafficNum + 1) * 16.67))
        : Math.max(10, 95 - i * 5)

      return {
        keyword,
        source: 'google' as const,
        category: detectCategory(keyword),
        trendScore,
        relatedKeywords: generateRelatedKeywords(keyword),
        fetchedAt,
      }
    })

    // Filter out low-value keywords (weather, breaking news, live scores, etc.)
    const filtered = topics.filter(t => !isLowValueKeyword(t.keyword))
    console.log(`[trends] Google Trends: ${topics.length} topics fetched, ${filtered.length} after quality filter`)
    return filtered
  } catch (err) {
    console.error('[trends] Google Trends fetch failed:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Supplement main Google Trends results with curated high-CPC keyword variations.
 * The Google Trends RSS feed does not support ?q= query parameters, so instead
 * we generate well-known high-CPC keywords for Korean blog monetization.
 */
async function fetchGoogleTrendsByCategory(): Promise<TrendingTopic[]> {
  const fetchedAt = new Date().toISOString()
  // The Google Trends RSS feed doesn't support ?q= query parameters.
  // Instead, generate curated high-CPC keyword variations that supplement
  // the main RSS feed results.
  const highCPCCategories: Array<{ keywords: string[]; category: string }> = [
    { keywords: ['소상공인 대출 금리 비교', '신용대출 금리 낮은 곳', '전세자금 대출 조건'], category: '금융' },
    { keywords: ['아파트 청약 자격 조건', '전세 계약 갱신권', '부동산 취득세 계산'], category: '부동산' },
    { keywords: ['실업급여 신청 방법', '정부지원금 종류 2026', '근로장려금 신청 자격'], category: '정부지원' },
    { keywords: ['건강검진 무료 대상', '국민건강보험 환급금', '종합건강검진 비용'], category: '건강' },
    { keywords: ['자동차보험 비교 사이트', '실비보험 청구 방법', '암보험 추천 비교'], category: '보험' },
  ]

  const results: TrendingTopic[] = []
  for (const cat of highCPCCategories) {
    for (const keyword of cat.keywords) {
      results.push({
        keyword,
        source: 'google',
        category: cat.category,
        trendScore: Math.floor(55 + Math.random() * 35),
        relatedKeywords: generateRelatedKeywords(keyword),
        fetchedAt,
      })
    }
  }

  console.log(`[trends] High-CPC supplementary keywords: ${results.length} topics`)
  return results
}

/**
 * Fetch Naver trending topics.
 * Uses Naver Search API if NAVER_CLIENT_ID / NAVER_CLIENT_SECRET env vars are set.
 * Falls back to high-CPC category mock topics otherwise.
 */
export async function fetchNaverTrends(): Promise<TrendingTopic[]> {
  const fetchedAt = new Date().toISOString()
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.log('[trends] Naver API keys not set — using fallback topics')
    return generateFallbackTopics('naver', fetchedAt)
  }

  try {
    console.log('[trends] Fetching Naver trending topics...')
    // Query multiple high-value categories
    const queries = ['정부지원금', '대출', '부동산', '보험', '건강']
    const allTopics: TrendingTopic[] = []

    for (const query of queries) {
      const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&sort=date&display=5`
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) continue

      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: any[] = data.items ?? []

      for (const item of items.slice(0, 3)) {
        const title = (item.title as string)
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .trim()

        if (title.length > 5) {
          allTopics.push({
            keyword: title.substring(0, 50),
            source: 'naver',
            category: query,
            trendScore: Math.floor(50 + Math.random() * 40),
            relatedKeywords: generateRelatedKeywords(title),
            fetchedAt,
          })
        }
      }
    }

    console.log(`[trends] Naver: ${allTopics.length} topics fetched`)
    return allTopics
  } catch (err) {
    console.error('[trends] Naver fetch failed:', err instanceof Error ? err.message : err)
    return generateFallbackTopics('naver', fetchedAt)
  }
}

/**
 * Fetch Daum/Kakao trending topics.
 * Uses Kakao Local/Search API if KAKAO_API_KEY env var is set.
 * Falls back to mock topics otherwise.
 */
export async function fetchDaumTrends(): Promise<TrendingTopic[]> {
  const fetchedAt = new Date().toISOString()
  const kakaoKey = process.env.KAKAO_API_KEY

  if (!kakaoKey) {
    console.log('[trends] Kakao API key not set — using fallback topics')
    return generateFallbackTopics('daum', fetchedAt)
  }

  try {
    console.log('[trends] Fetching Daum/Kakao trending topics...')
    const queries = ['보험', '부동산', '자격증', '건강', '재테크']
    const allTopics: TrendingTopic[] = []

    for (const query of queries) {
      const url = `https://dapi.kakao.com/v2/search/web?query=${encodeURIComponent(query)}&size=3`
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Authorization: `KakaoAK ${kakaoKey}`,
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) continue

      const data = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const documents: any[] = data.documents ?? []

      for (const doc of documents) {
        const title = (doc.title as string)
          .replace(/<[^>]+>/g, '')
          .trim()

        if (title.length > 5) {
          allTopics.push({
            keyword: title.substring(0, 50),
            source: 'daum',
            category: query,
            trendScore: Math.floor(45 + Math.random() * 40),
            relatedKeywords: generateRelatedKeywords(title),
            fetchedAt,
          })
        }
      }
    }

    console.log(`[trends] Daum: ${allTopics.length} topics fetched`)
    return allTopics
  } catch (err) {
    console.error('[trends] Daum fetch failed:', err instanceof Error ? err.message : err)
    return generateFallbackTopics('daum', fetchedAt)
  }
}

/**
 * Rotate fallback topics based on day-of-year so results feel fresh daily.
 */
function getRotatedFallbackTopics(): typeof FALLBACK_TOPICS {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const offset = dayOfYear % 5 // rotate every day
  const rotated = [...FALLBACK_TOPICS.slice(offset), ...FALLBACK_TOPICS.slice(0, offset)]
  return rotated
}

/**
 * Generate fallback trending topics from high-CPC Korean niches.
 */
function generateFallbackTopics(
  source: 'google' | 'naver' | 'daum',
  fetchedAt: string
): TrendingTopic[] {
  const rotated = getRotatedFallbackTopics()
  const sourceOffset = source === 'google' ? 0 : source === 'naver' ? 5 : 10
  return rotated.slice(sourceOffset, sourceOffset + 5).map((t) => ({
    keyword: t.keyword,
    source,
    category: t.category,
    trendScore: t.score - sourceOffset,
    relatedKeywords: generateRelatedKeywords(t.keyword),
    fetchedAt,
  }))
}

/**
 * Generate related keyword suggestions for a given keyword.
 * Picks 4 random suffixes for variety on each call.
 */
function generateRelatedKeywords(keyword: string): string[] {
  const suffixes = ['방법', '신청', '조건', '후기', '2026', '비교', '추천', '자격', '기간', '혜택']
  // Pick 4 random suffixes for variety
  const shuffled = suffixes.sort(() => Math.random() - 0.5)
  return shuffled
    .slice(0, 4)
    .map((s) => `${keyword} ${s}`)
    .filter((k) => k !== keyword)
}

/**
 * Normalize a keyword for deduplication comparison.
 */
function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^가-힣a-z0-9]/g, '')
}

/**
 * Convert evergreen keywords into TrendingTopic format
 * so they can be merged into the unified keyword list.
 */
function getEvergreenAsTrends(): TrendingTopic[] {
  const fetchedAt = new Date().toISOString()
  const evergreenKeywords = getAllEvergreenKeywords()

  return evergreenKeywords.map((ek) => ({
    keyword: ek.keyword,
    source: 'evergreen' as const,
    category: ek.category,
    trendScore: ek.demandScore,
    relatedKeywords: generateRelatedKeywords(ek.keyword),
    fetchedAt,
    keywordType: ek.keywordType,
    reason: ek.reason,
  }))
}

/**
 * Fetch and combine trends from all sources, deduplicate, and rank by score.
 */
export async function getAllTrends(): Promise<TrendingTopic[]> {
  console.log('[trends] Starting getAllTrends...')

  const hasNaverKeys = !!(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET)
  const hasKakaoKey = !!process.env.KAKAO_API_KEY

  const promises: Promise<TrendingTopic[]>[] = [fetchGoogleTrends()]

  if (hasNaverKeys) {
    promises.push(fetchNaverTrends())
  }
  if (hasKakaoKey) {
    promises.push(fetchDaumTrends())
  }

  // If no external API keys, supplement with category-specific Google trends
  if (!hasNaverKeys && !hasKakaoKey) {
    promises.push(fetchGoogleTrendsByCategory())
  }

  // Include evergreen + seasonal keywords for consistent demand
  promises.push(Promise.resolve(getEvergreenAsTrends()))

  const results = await Promise.all(promises)
  const allTopics = results.flat()

  // Deduplicate by normalized keyword
  const seen = new Map<string, TrendingTopic>()
  for (const topic of allTopics) {
    const key = normalizeKeyword(topic.keyword)
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, topic)
    } else {
      // Merge: keep highest score, combine related keywords
      const merged: TrendingTopic = {
        ...existing,
        trendScore: Math.max(existing.trendScore, topic.trendScore),
        relatedKeywords: [
          ...new Set([...existing.relatedKeywords, ...topic.relatedKeywords]),
        ].slice(0, 10),
      }
      seen.set(key, merged)
    }
  }

  const deduped = Array.from(seen.values())

  // Filter out low-value keywords (weather, breaking news, live scores, etc.)
  const quality = deduped.filter(t => calculateKeywordQuality(t.keyword) >= 30)

  // Sort by combined score: weight quality higher than raw trend volume
  quality.sort((a, b) => {
    const qualA = calculateKeywordQuality(a.keyword)
    const qualB = calculateKeywordQuality(b.keyword)
    const scoreA = a.trendScore * 0.3 + qualA * 0.7
    const scoreB = b.trendScore * 0.3 + qualB * 0.7
    return scoreB - scoreA
  })

  console.log(`[trends] getAllTrends complete: ${quality.length} quality topics (filtered from ${deduped.length} unique, ${allTopics.length} total)`)
  return quality
}
