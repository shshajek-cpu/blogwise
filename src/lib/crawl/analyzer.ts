// Keyword Analysis & Revenue Scoring Engine
// Estimates CPC, competition, search volume, and revenue potential for Korean keywords

import type { TrendingTopic } from './trends'

export interface KeywordAnalysis {
  keyword: string
  estimatedCPC: number              // USD
  competitionLevel: 'low' | 'medium' | 'high'
  searchVolumeEstimate: 'low' | 'medium' | 'high' | 'very_high'
  revenuePotential: number          // 0-100 score
  suggestedTitle: string
  suggestedCategory: string
  longTailVariants: string[]
}

// ---- CPC Niche Map ----
// Maps Korean niche keywords to [minCPC, maxCPC] in USD

interface NicheConfig {
  patterns: string[]
  cpcRange: [number, number]
  category: string
  searchVolume: 'low' | 'medium' | 'high' | 'very_high'
}

const NICHE_CONFIGS: NicheConfig[] = [
  {
    patterns: ['법률', '법무', '변호사', '소송', '계약서', '형사', '민사', '이혼', '상속', '법원'],
    cpcRange: [2.0, 8.0],
    category: '법률',
    searchVolume: 'medium',
  },
  {
    patterns: ['대출', '금융', '보험', '카드', '저축', '적금', '금리', '신용', '투자', '주식', '펀드', '코인', '가상화폐', '재테크', '연금', '퇴직금', '세금', '소득세', '부가세', '연말정산'],
    cpcRange: [1.5, 6.0],
    category: '금융',
    searchVolume: 'high',
  },
  {
    patterns: ['부동산', '아파트', '전세', '월세', '임대', '분양', '청약', '취득세', '재개발', '재건축', '주택', '토지', '상가'],
    cpcRange: [1.0, 4.0],
    category: '부동산',
    searchVolume: 'high',
  },
  {
    patterns: ['지원금', '보조금', '급여', '실업급여', '육아휴직', '정부', '지원사업', '복지', '국민연금', '건강보험', '고용보험', '산재보험'],
    cpcRange: [0.8, 3.0],
    category: '정부지원',
    searchVolume: 'very_high',
  },
  {
    patterns: ['건강', '의료', '병원', '약', '질병', '치료', '수술', '다이어트', '영양', '비타민', '운동', '헬스', '암', '당뇨', '고혈압'],
    cpcRange: [0.5, 2.0],
    category: '건강',
    searchVolume: 'very_high',
  },
  {
    patterns: ['자격증', '교육', '공부', '시험', '합격', '학원', '취업', '이직', '면접', '스펙', '영어', '토익', '공무원', '대학교', '학점'],
    cpcRange: [0.5, 2.0],
    category: '교육',
    searchVolume: 'high',
  },
  {
    patterns: ['개발', '프로그래밍', 'IT', '코딩', '소프트웨어', '앱', '게임', 'AI', '인공지능', '클라우드', '서버', '데이터'],
    cpcRange: [0.3, 1.0],
    category: 'IT',
    searchVolume: 'medium',
  },
  {
    patterns: ['여행', '관광', '호텔', '항공', '패키지', '해외', '국내여행', '제주', '부산', '경주', '비자'],
    cpcRange: [0.2, 0.8],
    category: '여행',
    searchVolume: 'high',
  },
  {
    patterns: ['요리', '레시피', '음식', '맛집', '식당', '카페', '베이킹', '쿠킹', '다이어트 식단'],
    cpcRange: [0.1, 0.5],
    category: '요리',
    searchVolume: 'very_high',
  },
  {
    patterns: ['드라마', '영화', '연예', '아이돌', '음악', '스포츠', '축구', '야구', '게임', '웹툰', '예능'],
    cpcRange: [0.05, 0.3],
    category: '엔터테인먼트',
    searchVolume: 'very_high',
  },
]

// Default when no niche matches
const DEFAULT_NICHE: Omit<NicheConfig, 'patterns'> = {
  cpcRange: [0.1, 0.5],
  category: '생활정보',
  searchVolume: 'medium',
}

// Korean title suffix templates for SEO
const TITLE_TEMPLATES: Record<string, string[]> = {
  법률: [
    '{keyword}, 이것만 알면 끝! 실전 핵심 정리',
    '처음 겪는 {keyword}? 당황하지 마세요',
    '{keyword} A to Z – 변호사가 쉽게 풀어드립니다',
    '모르면 손해 보는 {keyword} 핵심 포인트',
    '{keyword}, 실제 사례로 알아보는 실전 가이드',
    '5분 만에 이해하는 {keyword} 완전 정복',
  ],
  금융: [
    '{keyword}, 나한테 맞는 선택은? 비교 분석',
    '직접 해봤습니다 – {keyword} 솔직 후기',
    '{keyword} 신청 전 반드시 확인할 3가지',
    '돈 버는 사람들의 {keyword} 활용법',
    '{keyword}, 은행 직원이 안 알려주는 꿀팁',
    '초보도 쉽게 따라하는 {keyword} 신청 방법',
  ],
  부동산: [
    '{keyword}, 전문가가 짚어주는 핵심 체크리스트',
    '이것 놓치면 후회합니다 – {keyword} 필수 정보',
    '{keyword} 실전 경험담: 시행착오와 해결법',
    '부동산 초보를 위한 {keyword} 쉬운 설명',
    '{keyword}, 계약 전 꼭 확인해야 할 것들',
    '현직 공인중개사가 알려주는 {keyword} 핵심',
  ],
  정부지원: [
    '아직도 안 받으셨어요? {keyword} 신청 방법',
    '{keyword}, 자격 조건부터 신청까지 한 번에',
    '놓치기 쉬운 {keyword} – 지금 바로 확인하세요',
    '{keyword} 받는 법, 생각보다 간단합니다',
    '내가 {keyword} 대상자일까? 자가 진단 가이드',
    '{keyword}, 신청 기간 놓치지 마세요! 단계별 안내',
  ],
  건강: [
    '{keyword}, 의사 선생님이 알려주는 진짜 해결법',
    '혹시 나도? {keyword} 초기 증상과 대처법',
    '{keyword} 때문에 고민이라면 읽어보세요',
    '일상에서 실천하는 {keyword} 관리 비법',
    '{keyword}, 잘못된 상식 vs 진짜 팩트',
    '병원 가기 전 알아두면 좋은 {keyword} 정보',
  ],
  교육: [
    '{keyword} 합격자가 직접 알려주는 공부법',
    '시간 없는 직장인을 위한 {keyword} 속성 정리',
    '{keyword}, 이 순서대로 준비하면 됩니다',
    '혼자서도 가능한 {keyword} 독학 로드맵',
    '{keyword} 준비 중이라면 꼭 봐야 할 핵심 정리',
    '현직자가 말하는 {keyword}의 현실과 준비법',
  ],
  IT: [
    '{keyword} 입문, 여기서부터 시작하세요',
    '현업 개발자가 추천하는 {keyword} 학습법',
    '{keyword} 실무 적용기 – 삽질 없이 배우기',
    '비전공자도 이해하는 {keyword} 쉬운 설명',
    '{keyword}, 이것부터 익히면 나머지는 쉽습니다',
    '2026년 {keyword} 트렌드와 시작 가이드',
  ],
  여행: [
    '{keyword} 다녀왔습니다 – 솔직 여행 후기',
    '현지인이 추천하는 {keyword} 숨은 명소',
    '{keyword} 여행 경비 아끼는 실전 팁',
    '처음 가는 {keyword}? 이것만 준비하세요',
    '{keyword} 여행 코스, 이 루트가 정답!',
    '알뜰하게 즐기는 {keyword} 여행 플랜',
  ],
  요리: [
    '{keyword} 황금 레시피 – 실패 없이 만드는 법',
    '자취생도 뚝딱! 초간단 {keyword} 만들기',
    '{keyword}, 식당 맛 그대로 집에서 재현하기',
    '엄마한테 배운 {keyword} 비법 레시피',
    '10분 완성 {keyword} – 바쁜 날 딱 좋은 메뉴',
    '{keyword} 맛있게 만드는 숨겨진 한 가지 비법',
  ],
  엔터테인먼트: [
    '{keyword}, 팬이라면 꼭 알아야 할 이야기',
    '화제의 {keyword} – 직접 확인해봤습니다',
    '{keyword} 정리: 핵심만 쏙쏙 골라담았습니다',
    '요즘 핫한 {keyword}, 뭐가 다를까?',
    '{keyword} 입문자를 위한 친절한 안내서',
    '놓치면 아쉬운 {keyword} 하이라이트 모음',
  ],
  생활정보: [
    '{keyword}, 알고 나면 정말 간단합니다',
    '생활 속 {keyword} 꿀팁 모음',
    '{keyword} 때문에 고민? 이렇게 해결하세요',
    '직접 해본 {keyword} 후기와 팁',
    '{keyword}, 몰랐으면 계속 손해 봤을 정보',
    '누구나 따라 할 수 있는 {keyword} 방법',
  ],
}

// Long-tail suffix/prefix sets by category
const LONG_TAIL_SUFFIXES: string[] = [
  '방법', '추천', '비교', '후기', '가격', '신청방법', '조건', '자격', '2026',
  '무료', '쉬운', '초보', '완벽 가이드', '총정리', '순위', '장단점', '주의사항',
]

const LONG_TAIL_PREFIXES: string[] = [
  '초보자를 위한', '전문가가 추천하는', '2026년 최신', '무료로 받는',
  '쉽게 이해하는', '꼭 알아야 할',
]

// ---- Niche Matching ----

function matchNiche(keyword: string): Omit<NicheConfig, 'patterns'> {
  const lower = keyword.toLowerCase()
  for (const niche of NICHE_CONFIGS) {
    for (const pattern of niche.patterns) {
      if (lower.includes(pattern)) {
        return { cpcRange: niche.cpcRange, category: niche.category, searchVolume: niche.searchVolume }
      }
    }
  }
  return DEFAULT_NICHE
}

// ---- Competition Analysis ----

/**
 * Estimate competition based on keyword length, word count, and specificity.
 * Longer, more specific keywords = lower competition = easier for new blogs to rank.
 */
function estimateCompetition(keyword: string): 'low' | 'medium' | 'high' {
  const len = keyword.replace(/\s/g, '').length
  const wordCount = keyword.split(/\s+/).length

  // Very specific long-tail keywords (e.g., "2026 소상공인 대출 조건 신청방법")
  if (wordCount >= 4 || len >= 15) return 'low'
  // Moderate specificity (e.g., "신용대출 금리 비교")
  if (wordCount >= 3 || len >= 10) return 'low'
  // Short phrases (e.g., "대출 조건")
  if (wordCount >= 2 || len >= 7) return 'medium'
  // Head terms (e.g., "대출") - nearly impossible for new blogs
  return 'high'
}

/**
 * Detect if keyword contains action/intent words that signal high user intent.
 * These keywords convert better for AdSense (users clicking ads for solutions).
 */
function hasActionIntent(keyword: string): boolean {
  const actionWords = ['방법', '신청', '조건', '추천', '비교', '가격', '후기', '하는법', '총정리', '계산', '가이드', '절차', '서류', '자격']
  return actionWords.some(w => keyword.includes(w))
}

/**
 * Detect if keyword contains specificity markers (year, numbers, conditions).
 */
function hasSpecificityMarkers(keyword: string): boolean {
  const markers = ['2025', '2026', '2027', 'TOP', '무료', '최신', '완벽', '단계']
  return markers.some(m => keyword.toLowerCase().includes(m.toLowerCase()))
}

// ---- Revenue Potential ----

const VOLUME_MULTIPLIERS: Record<string, number> = {
  low: 0.3,
  medium: 0.6,
  high: 0.85,
  very_high: 1.0,
}

// New blog SEO strategy: low competition = much higher score
// A new blog cannot rank for high-competition head terms
const COMPETITION_FACTORS: Record<string, number> = {
  low: 1.0,     // long-tail: easy to rank → full score
  medium: 0.45,  // moderate: takes effort → halved
  high: 0.1,    // head term: impossible for new blog → near zero
}

/**
 * Calculate normalized revenue potential score (0-100).
 * Optimized for new blog SEO: heavily rewards low-competition long-tail keywords
 * with action intent, over high-volume head terms.
 *
 * Formula: baseCPC * volume * competition * (1 + bonuses), normalized to 0-100
 *   - Action intent keywords (방법/신청/비교): +30% bonus
 *   - Long-tail (4+ words): +20% bonus
 *   - Specificity markers (year, 무료, 최신): +10% bonus
 *   - Trend boost: up to +20%
 */
function calculateRevenuePotential(
  cpcRange: [number, number],
  volume: 'low' | 'medium' | 'high' | 'very_high',
  competition: 'low' | 'medium' | 'high',
  trendScore: number,
  keyword: string = ''
): number {
  const midCPC = (cpcRange[0] + cpcRange[1]) / 2
  const volMult = VOLUME_MULTIPLIERS[volume]
  const compFactor = COMPETITION_FACTORS[competition]
  const trendBoost = 1 + (trendScore / 100) * 0.2  // up to 20% boost from trends

  // Bonus multipliers for SEO-friendly keywords
  let intentBonus = 1.0
  if (keyword) {
    if (hasActionIntent(keyword)) intentBonus += 0.3       // +30% for action keywords
    const wordCount = keyword.split(/\s+/).length
    if (wordCount >= 4) intentBonus += 0.2                 // +20% for long-tail
    else if (wordCount >= 3) intentBonus += 0.1            // +10% for medium-tail
    if (hasSpecificityMarkers(keyword)) intentBonus += 0.1 // +10% for specificity
  }

  // Max possible raw: 8.0 CPC * 1.0 vol * 1.0 comp * 1.2 trend * 1.7 intent = ~16.32
  const raw = midCPC * volMult * compFactor * trendBoost * intentBonus
  const score = Math.min(100, Math.round((raw / 16.5) * 100))
  return Math.max(1, score)
}

// ---- Title Generation ----

function generateTitle(keyword: string, category: string): string {
  const templates = TITLE_TEMPLATES[category] ?? TITLE_TEMPLATES['생활정보']
  // Use keyword hash for deterministic but varied selection
  const hash = keyword.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const template = templates[hash % templates.length]
  return template.replace('{keyword}', keyword)
}

// ---- Long-tail Variants ----

/**
 * Generate long-tail keyword variants by appending suffixes and prepending prefixes.
 */
export function generateLongTailVariants(keyword: string): string[] {
  const variants = new Set<string>()

  // Suffix variants (most important)
  for (const suffix of LONG_TAIL_SUFFIXES.slice(0, 8)) {
    variants.add(`${keyword} ${suffix}`)
  }

  // Prefix variants (more specific)
  for (const prefix of LONG_TAIL_PREFIXES.slice(0, 4)) {
    variants.add(`${prefix} ${keyword}`)
  }

  // Year-specific variant
  variants.add(`${keyword} 2026년`)
  variants.add(`${keyword} 신청 방법`)

  // Remove the original keyword if accidentally included
  variants.delete(keyword)

  return Array.from(variants).slice(0, 12)
}

// ---- Main Analysis Functions ----

/**
 * Analyze a single keyword for revenue potential.
 */
export async function analyzeKeyword(
  keyword: string,
  trendScore: number = 50
): Promise<KeywordAnalysis> {
  const niche = matchNiche(keyword)
  const competition = estimateCompetition(keyword)
  const revenuePotential = calculateRevenuePotential(
    niche.cpcRange,
    niche.searchVolume,
    competition,
    trendScore,
    keyword
  )

  const midCPC = parseFloat(
    ((niche.cpcRange[0] + niche.cpcRange[1]) / 2).toFixed(2)
  )

  const suggestedTitle = generateTitle(keyword, niche.category)
  const longTailVariants = generateLongTailVariants(keyword)

  return {
    keyword,
    estimatedCPC: midCPC,
    competitionLevel: competition,
    searchVolumeEstimate: niche.searchVolume,
    revenuePotential,
    suggestedTitle,
    suggestedCategory: niche.category,
    longTailVariants,
  }
}

/**
 * Rank multiple trending topics by revenue potential.
 * Returns sorted array (highest revenue first).
 */
export async function rankTopicsByRevenue(
  topics: TrendingTopic[]
): Promise<KeywordAnalysis[]> {
  if (topics.length === 0) return []

  console.log(`[analyzer] Ranking ${topics.length} topics by revenue potential...`)

  const analyses = await Promise.all(
    topics.map((topic) => analyzeKeyword(topic.keyword, topic.trendScore))
  )

  analyses.sort((a, b) => b.revenuePotential - a.revenuePotential)

  console.log(`[analyzer] Top topic: "${analyses[0]?.keyword}" (score: ${analyses[0]?.revenuePotential})`)
  return analyses
}
