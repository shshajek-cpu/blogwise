// Evergreen & Seasonal Keyword Engine
// Provides keywords people consistently search for, not just viral trends.
// Three pillars: Seasonal calendar, Evergreen demand, Life-event clusters.

export type KeywordType = 'evergreen' | 'seasonal' | 'trending'

export interface EvergreenKeyword {
  keyword: string
  category: string
  keywordType: KeywordType
  demandScore: number        // 0-100: how consistently this is searched
  seasonalMonths?: number[]  // months (1-12) when demand peaks
  reason: string             // why this keyword is recommended now
  searchIntent: 'informational' | 'comparison' | 'action' | 'review'
}

// ── Seasonal Calendar ─────────────────────────────────────────────────────────
// Maps each month to keywords that peak during that period in Korea.

const SEASONAL_CALENDAR: Record<number, Array<{ keyword: string; category: string; demandScore: number; searchIntent: EvergreenKeyword['searchIntent'] }>> = {
  1: [
    { keyword: '연말정산 하는법', category: '금융', demandScore: 95, searchIntent: 'action' },
    { keyword: '연말정산 환급금 조회', category: '금융', demandScore: 92, searchIntent: 'action' },
    { keyword: '새해 목표 세우기', category: '생활정보', demandScore: 60, searchIntent: 'informational' },
    { keyword: '겨울철 난방비 절약 방법', category: '생활정보', demandScore: 75, searchIntent: 'informational' },
    { keyword: '독감 예방접종 가격', category: '건강', demandScore: 70, searchIntent: 'comparison' },
  ],
  2: [
    { keyword: '설날 인사말 모음', category: '생활정보', demandScore: 85, searchIntent: 'informational' },
    { keyword: '명절 선물 추천', category: '생활정보', demandScore: 80, searchIntent: 'comparison' },
    { keyword: '봄 이사 비용', category: '생활정보', demandScore: 72, searchIntent: 'comparison' },
    { keyword: '전세 계약 갱신 방법', category: '부동산', demandScore: 78, searchIntent: 'action' },
    { keyword: '2026년 달라지는 제도', category: '정부지원', demandScore: 88, searchIntent: 'informational' },
  ],
  3: [
    { keyword: '새학기 준비물 리스트', category: '교육', demandScore: 80, searchIntent: 'informational' },
    { keyword: '이직 시기 퇴직금 계산', category: '금융', demandScore: 82, searchIntent: 'action' },
    { keyword: '봄 알레르기 약 추천', category: '건강', demandScore: 75, searchIntent: 'comparison' },
    { keyword: '자동차세 납부 방법', category: '금융', demandScore: 78, searchIntent: 'action' },
    { keyword: '건강검진 예약 방법', category: '건강', demandScore: 85, searchIntent: 'action' },
  ],
  4: [
    { keyword: '벚꽃 명소 추천', category: '여행', demandScore: 88, searchIntent: 'comparison' },
    { keyword: '봄 나들이 장소 추천', category: '여행', demandScore: 82, searchIntent: 'comparison' },
    { keyword: '종합소득세 준비 서류', category: '금융', demandScore: 75, searchIntent: 'informational' },
    { keyword: '국민건강보험 환급금 신청', category: '건강', demandScore: 80, searchIntent: 'action' },
    { keyword: '어린이보험 비교 추천', category: '보험', demandScore: 70, searchIntent: 'comparison' },
  ],
  5: [
    { keyword: '종합소득세 신고 방법', category: '금융', demandScore: 95, searchIntent: 'action' },
    { keyword: '종합소득세 절세 방법', category: '금융', demandScore: 90, searchIntent: 'informational' },
    { keyword: '근로장려금 신청 자격', category: '정부지원', demandScore: 92, searchIntent: 'action' },
    { keyword: '어버이날 선물 추천', category: '생활정보', demandScore: 85, searchIntent: 'comparison' },
    { keyword: '어린이날 가볼만한 곳', category: '여행', demandScore: 80, searchIntent: 'comparison' },
  ],
  6: [
    { keyword: '에어컨 추천 가성비', category: '생활정보', demandScore: 88, searchIntent: 'comparison' },
    { keyword: '제습기 추천 순위', category: '생활정보', demandScore: 82, searchIntent: 'comparison' },
    { keyword: '여름 전기세 절약 방법', category: '생활정보', demandScore: 78, searchIntent: 'informational' },
    { keyword: '장마철 곰팡이 제거 방법', category: '생활정보', demandScore: 75, searchIntent: 'informational' },
    { keyword: '주택청약 당첨 확률 높이기', category: '부동산', demandScore: 80, searchIntent: 'informational' },
  ],
  7: [
    { keyword: '여름휴가 추천 국내', category: '여행', demandScore: 92, searchIntent: 'comparison' },
    { keyword: '해외여행 준비물 체크리스트', category: '여행', demandScore: 88, searchIntent: 'informational' },
    { keyword: '여름 물놀이 장소 추천', category: '여행', demandScore: 85, searchIntent: 'comparison' },
    { keyword: '자외선 차단제 추천', category: '건강', demandScore: 80, searchIntent: 'comparison' },
    { keyword: '재산세 납부 방법', category: '금융', demandScore: 78, searchIntent: 'action' },
  ],
  8: [
    { keyword: '대학교 등록금 대출', category: '교육', demandScore: 85, searchIntent: 'action' },
    { keyword: '추석 기차표 예매 꿀팁', category: '생활정보', demandScore: 82, searchIntent: 'informational' },
    { keyword: '가을여행 추천 명소', category: '여행', demandScore: 78, searchIntent: 'comparison' },
    { keyword: '태풍 대비 방법', category: '생활정보', demandScore: 72, searchIntent: 'informational' },
    { keyword: '전세자금 대출 조건', category: '금융', demandScore: 80, searchIntent: 'action' },
  ],
  9: [
    { keyword: '추석 인사말 모음', category: '생활정보', demandScore: 88, searchIntent: 'informational' },
    { keyword: '추석 선물 추천', category: '생활정보', demandScore: 85, searchIntent: 'comparison' },
    { keyword: '추석 고속도로 통행료 무료', category: '생활정보', demandScore: 80, searchIntent: 'informational' },
    { keyword: '독감 예방접종 시기', category: '건강', demandScore: 82, searchIntent: 'informational' },
    { keyword: '환절기 건강관리 방법', category: '건강', demandScore: 75, searchIntent: 'informational' },
  ],
  10: [
    { keyword: '독감 예방접종 무료 대상', category: '건강', demandScore: 90, searchIntent: 'informational' },
    { keyword: '가을 단풍 명소', category: '여행', demandScore: 85, searchIntent: 'comparison' },
    { keyword: '난방비 절약 꿀팁', category: '생활정보', demandScore: 78, searchIntent: 'informational' },
    { keyword: '연말정산 미리보기', category: '금융', demandScore: 75, searchIntent: 'action' },
    { keyword: '자동차보험 갱신 비교', category: '보험', demandScore: 80, searchIntent: 'comparison' },
  ],
  11: [
    { keyword: '수능 준비 꿀팁', category: '교육', demandScore: 90, searchIntent: 'informational' },
    { keyword: '수능 후 대학 지원 전략', category: '교육', demandScore: 85, searchIntent: 'informational' },
    { keyword: '블랙프라이데이 할인 정보', category: '생활정보', demandScore: 88, searchIntent: 'informational' },
    { keyword: '겨울 타이어 교체 시기', category: '생활정보', demandScore: 78, searchIntent: 'informational' },
    { keyword: '연말정산 소득공제 항목', category: '금융', demandScore: 85, searchIntent: 'informational' },
  ],
  12: [
    { keyword: '연말정산 체크리스트', category: '금융', demandScore: 95, searchIntent: 'informational' },
    { keyword: '연말정산 공제 최대화 방법', category: '금융', demandScore: 92, searchIntent: 'informational' },
    { keyword: '크리스마스 선물 추천', category: '생활정보', demandScore: 88, searchIntent: 'comparison' },
    { keyword: '송년회 장소 추천', category: '생활정보', demandScore: 80, searchIntent: 'comparison' },
    { keyword: '내년 달라지는 부동산 제도', category: '부동산', demandScore: 82, searchIntent: 'informational' },
  ],
}

// ── Evergreen Keywords ────────────────────────────────────────────────────────
// Keywords people search consistently all year round (high-CPC AdSense niches).

const EVERGREEN_KEYWORDS: Array<{
  keyword: string
  category: string
  demandScore: number
  searchIntent: EvergreenKeyword['searchIntent']
}> = [
  // 금융 (CPC $1.5-6)
  { keyword: '신용대출 금리 비교', category: '금융', demandScore: 90, searchIntent: 'comparison' },
  { keyword: '적금 금리 높은 곳', category: '금융', demandScore: 88, searchIntent: 'comparison' },
  { keyword: '신용점수 올리는 방법', category: '금융', demandScore: 85, searchIntent: 'action' },
  { keyword: '주택담보대출 조건 비교', category: '금융', demandScore: 87, searchIntent: 'comparison' },
  { keyword: '연금저축 세액공제 한도', category: '금융', demandScore: 82, searchIntent: 'informational' },
  { keyword: 'ETF 투자 초보 가이드', category: '금융', demandScore: 78, searchIntent: 'informational' },

  // 정부지원 (CPC $0.8-3)
  { keyword: '정부지원금 종류 총정리', category: '정부지원', demandScore: 92, searchIntent: 'informational' },
  { keyword: '실업급여 신청 방법', category: '정부지원', demandScore: 90, searchIntent: 'action' },
  { keyword: '국민연금 수령액 계산', category: '정부지원', demandScore: 85, searchIntent: 'action' },
  { keyword: '건강보험 피부양자 조건', category: '정부지원', demandScore: 83, searchIntent: 'informational' },
  { keyword: '소상공인 지원금 신청', category: '정부지원', demandScore: 88, searchIntent: 'action' },
  { keyword: '육아휴직 급여 계산', category: '정부지원', demandScore: 80, searchIntent: 'action' },

  // 부동산 (CPC $1-4)
  { keyword: '전세 vs 월세 장단점', category: '부동산', demandScore: 85, searchIntent: 'comparison' },
  { keyword: '주택청약 가입 방법', category: '부동산', demandScore: 82, searchIntent: 'action' },
  { keyword: '부동산 취득세 계산기', category: '부동산', demandScore: 80, searchIntent: 'action' },
  { keyword: '전세 계약시 확인사항', category: '부동산', demandScore: 83, searchIntent: 'informational' },
  { keyword: '신혼부부 특별공급 조건', category: '부동산', demandScore: 78, searchIntent: 'informational' },

  // 보험 (CPC $1-4)
  { keyword: '실비보험 청구 방법', category: '보험', demandScore: 88, searchIntent: 'action' },
  { keyword: '자동차보험 비교 사이트', category: '보험', demandScore: 85, searchIntent: 'comparison' },
  { keyword: '암보험 가입 시 주의사항', category: '보험', demandScore: 80, searchIntent: 'informational' },
  { keyword: '태아보험 추천 비교', category: '보험', demandScore: 78, searchIntent: 'comparison' },

  // 건강 (CPC $0.5-2)
  { keyword: '건강검진 항목 종류', category: '건강', demandScore: 82, searchIntent: 'informational' },
  { keyword: '국가건강검진 대상 나이', category: '건강', demandScore: 80, searchIntent: 'informational' },
  { keyword: '비타민D 부족 증상', category: '건강', demandScore: 75, searchIntent: 'informational' },
  { keyword: '허리 통증 원인 해결법', category: '건강', demandScore: 78, searchIntent: 'informational' },

  // 생활정보 (CPC $0.3-1)
  { keyword: '여권 갱신 방법', category: '생활정보', demandScore: 82, searchIntent: 'action' },
  { keyword: '운전면허 갱신 온라인', category: '생활정보', demandScore: 80, searchIntent: 'action' },
  { keyword: '주민등록등본 인터넷 발급', category: '생활정보', demandScore: 78, searchIntent: 'action' },

  // 교육 (CPC $0.5-2)
  { keyword: '자격증 추천 취업', category: '교육', demandScore: 82, searchIntent: 'comparison' },
  { keyword: '공무원 시험 종류 난이도', category: '교육', demandScore: 80, searchIntent: 'informational' },
  { keyword: '토익 독학 공부법', category: '교육', demandScore: 78, searchIntent: 'informational' },
]

// ── Life-Event Keyword Clusters ───────────────────────────────────────────────
// Groups of keywords triggered by major life events.

interface LifeEventCluster {
  event: string
  emoji: string
  keywords: Array<{
    keyword: string
    category: string
    demandScore: number
    searchIntent: EvergreenKeyword['searchIntent']
  }>
}

const LIFE_EVENT_CLUSTERS: LifeEventCluster[] = [
  {
    event: '취업/이직',
    emoji: '💼',
    keywords: [
      { keyword: '이직 시 퇴직금 정산', category: '금융', demandScore: 85, searchIntent: 'action' },
      { keyword: '연봉 실수령액 계산기', category: '금융', demandScore: 90, searchIntent: 'action' },
      { keyword: '4대보험 계산 방법', category: '금융', demandScore: 82, searchIntent: 'action' },
      { keyword: '자기소개서 작성법', category: '교육', demandScore: 78, searchIntent: 'informational' },
      { keyword: '면접 질문 답변 예시', category: '교육', demandScore: 80, searchIntent: 'informational' },
    ],
  },
  {
    event: '결혼',
    emoji: '💍',
    keywords: [
      { keyword: '혼인신고 방법 서류', category: '생활정보', demandScore: 82, searchIntent: 'action' },
      { keyword: '신혼부부 전세대출 조건', category: '금융', demandScore: 88, searchIntent: 'action' },
      { keyword: '결혼 준비 체크리스트', category: '생활정보', demandScore: 80, searchIntent: 'informational' },
      { keyword: '신혼여행 추천 가성비', category: '여행', demandScore: 75, searchIntent: 'comparison' },
    ],
  },
  {
    event: '출산/육아',
    emoji: '👶',
    keywords: [
      { keyword: '출산휴가 급여 계산', category: '정부지원', demandScore: 85, searchIntent: 'action' },
      { keyword: '육아휴직 신청 방법', category: '정부지원', demandScore: 88, searchIntent: 'action' },
      { keyword: '영아수당 신청 자격', category: '정부지원', demandScore: 82, searchIntent: 'action' },
      { keyword: '산후조리원 비용 비교', category: '건강', demandScore: 78, searchIntent: 'comparison' },
      { keyword: '아이 돌봄 서비스 신청', category: '정부지원', demandScore: 80, searchIntent: 'action' },
    ],
  },
  {
    event: '내집 마련',
    emoji: '🏠',
    keywords: [
      { keyword: '주택청약 1순위 조건', category: '부동산', demandScore: 90, searchIntent: 'informational' },
      { keyword: '디딤돌 대출 조건 금리', category: '금융', demandScore: 88, searchIntent: 'action' },
      { keyword: '아파트 매매 절차', category: '부동산', demandScore: 82, searchIntent: 'informational' },
      { keyword: '등기 셀프 하는 방법', category: '부동산', demandScore: 78, searchIntent: 'action' },
      { keyword: '취득세 감면 조건', category: '금융', demandScore: 85, searchIntent: 'informational' },
    ],
  },
  {
    event: '은퇴 준비',
    emoji: '🧓',
    keywords: [
      { keyword: '국민연금 수령나이 조회', category: '금융', demandScore: 88, searchIntent: 'action' },
      { keyword: '퇴직금 IRP 세금 혜택', category: '금융', demandScore: 85, searchIntent: 'informational' },
      { keyword: '노후 준비 방법 50대', category: '금융', demandScore: 80, searchIntent: 'informational' },
      { keyword: '개인연금 추천 비교', category: '금융', demandScore: 82, searchIntent: 'comparison' },
    ],
  },
  {
    event: '자동차',
    emoji: '🚗',
    keywords: [
      { keyword: '자동차보험 다이렉트 비교', category: '보험', demandScore: 88, searchIntent: 'comparison' },
      { keyword: '중고차 구매 시 확인사항', category: '생활정보', demandScore: 82, searchIntent: 'informational' },
      { keyword: '자동차 리스 vs 할부', category: '금융', demandScore: 80, searchIntent: 'comparison' },
      { keyword: '전기차 보조금 신청', category: '정부지원', demandScore: 85, searchIntent: 'action' },
    ],
  },
]

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Get seasonal keywords for the current month (+ adjacent months for overlap).
 */
export function getSeasonalKeywords(): EvergreenKeyword[] {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1

  const results: EvergreenKeyword[] = []
  const seen = new Set<string>()

  // Current month keywords (full score)
  for (const item of SEASONAL_CALENDAR[currentMonth] ?? []) {
    if (seen.has(item.keyword)) continue
    seen.add(item.keyword)
    results.push({
      ...item,
      keywordType: 'seasonal',
      seasonalMonths: [currentMonth],
      reason: `${currentMonth}월 시즌 키워드 — 이 시기에 검색량 급증`,
    })
  }

  // Next month keywords (slightly lower score for early preparation content)
  for (const item of SEASONAL_CALENDAR[nextMonth] ?? []) {
    if (seen.has(item.keyword)) continue
    seen.add(item.keyword)
    results.push({
      ...item,
      demandScore: Math.max(0, item.demandScore - 10),
      keywordType: 'seasonal',
      seasonalMonths: [nextMonth],
      reason: `${nextMonth}월 대비 — 미리 준비하면 검색 유입 선점 가능`,
    })
  }

  return results
}

/**
 * Get evergreen keywords that are always in demand.
 */
export function getEvergreenKeywords(): EvergreenKeyword[] {
  return EVERGREEN_KEYWORDS.map((item) => ({
    ...item,
    keywordType: 'evergreen' as const,
    reason: '연중 꾸준한 검색 수요 — 한번 쓰면 계속 트래픽 유입',
  }))
}

/**
 * Get life-event keyword clusters.
 */
export function getLifeEventKeywords(): EvergreenKeyword[] {
  const results: EvergreenKeyword[] = []
  for (const cluster of LIFE_EVENT_CLUSTERS) {
    for (const item of cluster.keywords) {
      results.push({
        ...item,
        keywordType: 'evergreen' as const,
        reason: `${cluster.emoji} ${cluster.event} 관련 — 생애주기 키워드로 꾸준한 수요`,
      })
    }
  }
  return results
}

/**
 * Get ALL recommended keywords: seasonal + evergreen + life-events.
 * Deduplicates and sorts by demand score.
 */
export function getAllEvergreenKeywords(): EvergreenKeyword[] {
  const seasonal = getSeasonalKeywords()
  const evergreen = getEvergreenKeywords()
  const lifeEvent = getLifeEventKeywords()

  const all = [...seasonal, ...evergreen, ...lifeEvent]

  // Deduplicate by keyword (keep highest demandScore)
  const map = new Map<string, EvergreenKeyword>()
  for (const item of all) {
    const normalized = item.keyword.replace(/\s+/g, '').toLowerCase()
    const existing = map.get(normalized)
    if (!existing || item.demandScore > existing.demandScore) {
      map.set(normalized, item)
    }
  }

  const deduped = Array.from(map.values())

  // Sort: seasonal first (time-sensitive), then by demandScore
  deduped.sort((a, b) => {
    if (a.keywordType === 'seasonal' && b.keywordType !== 'seasonal') return -1
    if (b.keywordType === 'seasonal' && a.keywordType !== 'seasonal') return 1
    return b.demandScore - a.demandScore
  })

  return deduped
}

/**
 * Get the list of life event clusters (for UI display).
 */
export function getLifeEventClusters(): Array<{ event: string; emoji: string; count: number }> {
  return LIFE_EVENT_CLUSTERS.map((c) => ({
    event: c.event,
    emoji: c.emoji,
    count: c.keywords.length,
  }))
}
