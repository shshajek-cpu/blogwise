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
  searchIntent?: 'informational' | 'commercial' | 'transactional' | 'navigational'
}

export type SearchIntent = 'informational' | 'commercial' | 'transactional' | 'navigational'

// ---- CPC Niche Map ----
// Maps Korean niche keywords to [minCPC, maxCPC] in USD

interface NicheConfig {
  patterns: string[]
  cpcRange: [number, number]
  category: string
  searchVolume: 'low' | 'medium' | 'high' | 'very_high'
}

// ---- Subcategory CPC Map ----
// More precise CPC ranges keyed by subcategory patterns, checked before broad niche matching

interface SubcategoryConfig {
  patterns: string[]
  cpcRange: [number, number]
  category: string
  searchVolume: 'low' | 'medium' | 'high' | 'very_high'
}

const SUBCATEGORY_CONFIGS: SubcategoryConfig[] = [
  // 금융 subcategories
  {
    patterns: ['대출', '담보대출', '신용대출', '주택담보대출', '햇살론', '사잇돌', '카카오뱅크대출', '대출금리', '대출조건', '대출한도', '대출비교'],
    cpcRange: [2.0, 6.0],
    category: '금융',
    searchVolume: 'high',
  },
  {
    patterns: ['보험', '보험료', '보험비교', '보험추천', '종신보험', '보험설계'],
    cpcRange: [1.5, 5.0],
    category: '금융',
    searchVolume: 'high',
  },
  {
    patterns: ['투자', '주식', '펀드', '코인', '가상화폐', '재테크', 'ETF', '채권', '배당'],
    cpcRange: [1.0, 3.0],
    category: '금융',
    searchVolume: 'high',
  },
  {
    patterns: ['세금', '소득세', '부가세', '양도세', '취득세', '종부세', '연말정산', '세무', '탈세', '세금신고'],
    cpcRange: [1.5, 4.0],
    category: '금융',
    searchVolume: 'medium',
  },
  {
    patterns: ['저축', '적금', '예금', '금리', '이자', '연금', '퇴직금', '개인연금', 'IRP'],
    cpcRange: [0.5, 2.0],
    category: '금융',
    searchVolume: 'high',
  },
  {
    patterns: ['카드', '신용카드', '체크카드', '카드혜택', '카드추천', '카드발급'],
    cpcRange: [1.0, 3.5],
    category: '금융',
    searchVolume: 'high',
  },
  // 부동산 subcategories
  {
    patterns: ['아파트 매매', '부동산 매매', '주택 매매', '집 매매', '매물', '매도', '매수'],
    cpcRange: [1.5, 4.0],
    category: '부동산',
    searchVolume: 'high',
  },
  {
    patterns: ['전세', '전세금', '전세대출', '전세사기', '전세계약'],
    cpcRange: [1.0, 3.5],
    category: '부동산',
    searchVolume: 'high',
  },
  {
    patterns: ['청약', '아파트 청약', '청약통장', '청약조건', '청약 당첨', '분양', '사전청약'],
    cpcRange: [1.0, 3.0],
    category: '부동산',
    searchVolume: 'very_high',
  },
  {
    patterns: ['재개발', '재건축', '뉴타운', '도시재생'],
    cpcRange: [1.5, 4.0],
    category: '부동산',
    searchVolume: 'medium',
  },
  {
    patterns: ['월세', '임대', '임차', '전월세', '원룸', '오피스텔'],
    cpcRange: [0.8, 2.5],
    category: '부동산',
    searchVolume: 'high',
  },
  // 건강 subcategories
  {
    patterns: ['수술', '시술', '의료', '병원비', '진료', '입원', '외래', '수술비'],
    cpcRange: [1.0, 3.0],
    category: '건강',
    searchVolume: 'high',
  },
  {
    patterns: ['의료보험', '실비보험', '건강보험'],
    cpcRange: [1.5, 4.0],
    category: '건강',
    searchVolume: 'high',
  },
  {
    patterns: ['다이어트', '체중감량', '살빼기', '지방흡입', '식단', '운동법'],
    cpcRange: [0.5, 1.5],
    category: '건강',
    searchVolume: 'very_high',
  },
  {
    patterns: ['건강', '영양', '비타민', '영양제', '보충제', '건강기능식품'],
    cpcRange: [0.3, 1.0],
    category: '건강',
    searchVolume: 'very_high',
  },
  {
    patterns: ['암', '당뇨', '고혈압', '심장', '뇌졸중', '치매', '관절', '허리디스크', '질병', '치료'],
    cpcRange: [0.8, 2.5],
    category: '건강',
    searchVolume: 'high',
  },
  // 법률 subcategories
  {
    patterns: ['이혼', '상속', '유언', '가사'],
    cpcRange: [3.0, 8.0],
    category: '법률',
    searchVolume: 'medium',
  },
  {
    patterns: ['형사', '고소', '고발', '피의자', '변호사', '형사소송', '무죄', '벌금'],
    cpcRange: [2.0, 6.0],
    category: '법률',
    searchVolume: 'medium',
  },
  {
    patterns: ['부동산법', '임대차', '계약서', '공인중개사', '부동산분쟁'],
    cpcRange: [2.0, 5.0],
    category: '법률',
    searchVolume: 'low',
  },
  {
    patterns: ['노동법', '해고', '부당해고', '임금', '근로계약', '퇴직금소송', '산재'],
    cpcRange: [1.5, 4.0],
    category: '법률',
    searchVolume: 'medium',
  },
  {
    patterns: ['법률', '법무', '소송', '민사', '법원', '법적'],
    cpcRange: [2.0, 6.0],
    category: '법률',
    searchVolume: 'medium',
  },
  // 정부지원 subcategories
  {
    patterns: ['정부대출', '소상공인대출', '창업지원대출', '정책대출', '지원대출'],
    cpcRange: [1.0, 3.5],
    category: '정부지원',
    searchVolume: 'high',
  },
  {
    patterns: ['실업급여', '실업급여신청', '고용보험', '취업지원', '국민취업지원'],
    cpcRange: [0.8, 2.5],
    category: '정부지원',
    searchVolume: 'very_high',
  },
  {
    patterns: ['복지', '급여', '기초생활수급', '차상위', '한부모', '장애인급여'],
    cpcRange: [0.8, 2.5],
    category: '정부지원',
    searchVolume: 'very_high',
  },
  {
    patterns: ['보조금', '지원금', '지원사업', '정부지원', '창업보조금'],
    cpcRange: [0.7, 2.0],
    category: '정부지원',
    searchVolume: 'very_high',
  },
  {
    patterns: ['육아지원', '육아휴직', '출산급여', '아이돌봄', '보육료', '육아'],
    cpcRange: [0.8, 2.5],
    category: '정부지원',
    searchVolume: 'high',
  },
  // 보험 subcategories
  {
    patterns: ['자동차보험', '자차보험', '차보험', '다이렉트자동차보험'],
    cpcRange: [2.0, 5.0],
    category: '보험',
    searchVolume: 'very_high',
  },
  {
    patterns: ['생명보험', '종신보험', '정기보험', '사망보험'],
    cpcRange: [1.5, 4.0],
    category: '보험',
    searchVolume: 'medium',
  },
  {
    patterns: ['실비보험', '실손보험', '실손의료보험'],
    cpcRange: [1.0, 3.0],
    category: '보험',
    searchVolume: 'high',
  },
  {
    patterns: ['태아보험', '어린이보험', '태아보험추천'],
    cpcRange: [1.0, 3.0],
    category: '보험',
    searchVolume: 'medium',
  },
  {
    patterns: ['여행보험', '해외여행보험', '여행자보험'],
    cpcRange: [0.8, 2.5],
    category: '보험',
    searchVolume: 'medium',
  },
  // 교육 subcategories
  {
    patterns: ['공무원', '공무원시험', '공무원준비', '행정직', '경찰', '소방'],
    cpcRange: [0.8, 2.5],
    category: '교육',
    searchVolume: 'high',
  },
  {
    patterns: ['자격증', '국가자격증', '자격증시험', '자격증준비'],
    cpcRange: [0.5, 2.0],
    category: '교육',
    searchVolume: 'high',
  },
  {
    patterns: ['토익', '토플', '영어', '어학', 'IELTS', '영어시험'],
    cpcRange: [0.5, 1.5],
    category: '교육',
    searchVolume: 'high',
  },
  // IT subcategories
  {
    patterns: ['AI', '인공지능', '머신러닝', '딥러닝', 'ChatGPT', '챗GPT', 'LLM'],
    cpcRange: [0.5, 1.5],
    category: 'IT',
    searchVolume: 'high',
  },
  {
    patterns: ['클라우드', 'AWS', 'Azure', 'GCP', '서버', '호스팅'],
    cpcRange: [0.4, 1.2],
    category: 'IT',
    searchVolume: 'medium',
  },
  {
    patterns: ['개발', '프로그래밍', '코딩', '파이썬', 'Python', '자바', 'JavaScript'],
    cpcRange: [0.3, 1.0],
    category: 'IT',
    searchVolume: 'medium',
  },
]

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
  보험: [
    '{keyword}, 나에게 맞는 상품 고르는 법',
    '{keyword} 비교 분석 – 전문가가 직접 정리',
    '{keyword} 가입 전 꼭 알아야 할 5가지',
    '{keyword} 보험료 줄이는 실전 꿀팁',
    '{keyword}, 보험 전문가가 추천하는 선택 기준',
    '처음 가입하는 {keyword}, 이것부터 확인하세요',
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

// ---- Search Intent Classification ----

// Signal word lists for intent classification
const TRANSACTIONAL_SIGNALS = ['신청', '가입', '구매', '예약', '주문', '결제', '등록', '접수', '신청하기', '가입하기', '구매하기', '다운로드', '설치', '청약신청']
const COMMERCIAL_SIGNALS    = ['비교', '추천', '순위', '가격', '후기', '가성비', '리뷰', '평가', '랭킹', '베스트', '최저가', '할인', '혜택', '장단점', 'vs', '대비']
const NAVIGATIONAL_SIGNALS  = ['사이트', '홈페이지', '공식', '로그인', '접속', '바로가기', '링크', '주소', '공식사이트']
const INFORMATIONAL_SIGNALS = ['방법', '뜻', '종류', '원인', '증상', '의미', '이란', '이란?', '무엇', '어떻게', '왜', '하는법', '이유', '차이', '개념', '정의', '설명', '알아보기', '가이드', '총정리', '이해']

/**
 * Classify the search intent of a Korean keyword.
 *
 * Priority order: navigational > transactional > commercial > informational > informational (default)
 */
export function classifySearchIntent(keyword: string): SearchIntent {
  const lower = keyword.toLowerCase()

  // Navigational: user looking for a specific site or login page
  if (NAVIGATIONAL_SIGNALS.some(s => lower.includes(s))) return 'navigational'

  // Transactional: user ready to take an action
  if (TRANSACTIONAL_SIGNALS.some(s => lower.includes(s))) return 'transactional'

  // Commercial: user comparing or researching before a purchase/decision
  if (COMMERCIAL_SIGNALS.some(s => lower.includes(s))) return 'commercial'

  // Informational: user seeking knowledge
  if (INFORMATIONAL_SIGNALS.some(s => lower.includes(s))) return 'informational'

  // Default to informational for unknown patterns
  return 'informational'
}

// ---- Niche Matching ----

function matchNiche(keyword: string): Omit<NicheConfig, 'patterns'> {
  const lower = keyword.toLowerCase()

  // Check subcategories first (more precise CPC ranges)
  for (const sub of SUBCATEGORY_CONFIGS) {
    for (const pattern of sub.patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        return { cpcRange: sub.cpcRange, category: sub.category, searchVolume: sub.searchVolume }
      }
    }
  }

  // Fall back to broad niche configs
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
 * Estimate competition based on keyword length, word count, specificity, and intent signals.
 *
 * Scoring system (lower total score = lower competition):
 *   Base score from word count / length
 *   -1 per specificity marker (year, region, amount)
 *   -1 for comparison/vs intent (niche, transactional)
 *   -1 for tutorial/how-to intent (navigating a process)
 */
function estimateCompetition(keyword: string): 'low' | 'medium' | 'high' {
  const len = keyword.replace(/\s/g, '').length
  const wordCount = keyword.split(/\s+/).length

  // Start with a base competition score (higher = more competition)
  let score = 3  // default: high competition

  // Reward keyword length / word count
  if (wordCount >= 4 || len >= 15) score -= 2
  else if (wordCount >= 3 || len >= 10) score -= 2
  else if (wordCount >= 2 || len >= 7) score -= 1

  // Specificity markers reduce competition (year, region, amount, etc.)
  if (hasSpecificityMarkers(keyword)) score -= 1

  // Comparison intent keywords are typically mid-tail, lower competition
  const comparisonSignals = ['vs', '비교', '차이', '대비', '어떤게']
  if (comparisonSignals.some(s => keyword.toLowerCase().includes(s))) score -= 1

  // Tutorial / how-to intent signals long-tail specificity
  const tutorialSignals = ['방법', '하는법', '신청', '절차', '단계', '어떻게']
  if (tutorialSignals.some(s => keyword.includes(s))) score -= 1

  if (score <= 0) return 'low'
  if (score === 1) return 'low'
  if (score === 2) return 'medium'
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
 * Detect if keyword contains specificity markers (year, numbers, region, conditions).
 */
function hasSpecificityMarkers(keyword: string): boolean {
  // Year markers
  const yearPattern = /20\d{2}/
  if (yearPattern.test(keyword)) return true

  // Amount / number markers (e.g., "3천만원", "1억", "100만원")
  const amountPattern = /\d+(만원|억|천만|백만|원)/
  if (amountPattern.test(keyword)) return true

  // Region markers (major Korean cities/regions)
  const regions = ['서울', '부산', '인천', '대구', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '수원', '성남', '고양', '용인', '창원', '청주']
  if (regions.some(r => keyword.includes(r))) return true

  // Other specificity markers
  const markers = ['TOP', '무료', '최신', '완벽', '단계', '초보', '전문가']
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

// AdSense CTR multipliers by search intent.
// Transactional and commercial users are more likely to click ads.
const INTENT_CTR_MULTIPLIERS: Record<SearchIntent, number> = {
  transactional: 1.35,  // +35%: user ready to act, high ad relevance
  commercial:    1.20,  // +20%: user comparing products/services
  informational: 1.00,  // baseline: informational browsing
  navigational:  0.70,  // -30%: user looking for a specific page, low ad CTR
}

/**
 * Calculate normalized revenue potential score (0-100).
 * Optimized for new blog SEO: heavily rewards low-competition long-tail keywords
 * with action intent, over high-volume head terms.
 *
 * Formula: baseCPC * volume * competition * intentCTR * (1 + bonuses) * trendBoost
 *   - Action intent keywords (방법/신청/비교): +30% bonus
 *   - Long-tail (4+ words): +20% bonus
 *   - Specificity markers (year, region, 무료, 최신): +10% bonus
 *   - Comparison/tutorial signals: +10% bonus
 *   - Trend boost: up to +20%
 *   - Search intent CTR factor (transactional +35%, commercial +20%, navigational -30%)
 */
function calculateRevenuePotential(
  cpcRange: [number, number],
  volume: 'low' | 'medium' | 'high' | 'very_high',
  competition: 'low' | 'medium' | 'high',
  trendScore: number,
  keyword: string = '',
  intent: SearchIntent = 'informational'
): number {
  const midCPC = (cpcRange[0] + cpcRange[1]) / 2
  const volMult = VOLUME_MULTIPLIERS[volume]
  const compFactor = COMPETITION_FACTORS[competition]
  const trendBoost = 1 + (trendScore / 100) * 0.2  // up to 20% boost from trends
  const intentCTR = INTENT_CTR_MULTIPLIERS[intent]

  // Bonus multipliers for SEO-friendly keywords
  let intentBonus = 1.0
  if (keyword) {
    if (hasActionIntent(keyword)) intentBonus += 0.3        // +30% for action keywords
    const wordCount = keyword.split(/\s+/).length
    if (wordCount >= 4) intentBonus += 0.2                  // +20% for long-tail
    else if (wordCount >= 3) intentBonus += 0.1             // +10% for medium-tail
    if (hasSpecificityMarkers(keyword)) intentBonus += 0.1  // +10% for specificity

    // Comparison and tutorial signals add specificity bonus
    const comparisonSignals = ['vs', '비교', '차이', '대비']
    const tutorialSignals = ['방법', '하는법', '신청', '절차']
    if (comparisonSignals.some(s => keyword.toLowerCase().includes(s))) intentBonus += 0.1
    if (tutorialSignals.some(s => keyword.includes(s))) intentBonus += 0.05
  }

  // Max possible raw with new intent CTR factor:
  // 8.0 * 1.0 * 1.0 * 1.35 * 1.2 * 1.75 ≈ 22.68; normalize ceiling slightly higher
  const raw = midCPC * volMult * compFactor * trendBoost * intentBonus * intentCTR
  const score = Math.min(100, Math.round((raw / 22.5) * 100))
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
  const intent = classifySearchIntent(keyword)
  const revenuePotential = calculateRevenuePotential(
    niche.cpcRange,
    niche.searchVolume,
    competition,
    trendScore,
    keyword,
    intent
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
    searchIntent: intent,
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
