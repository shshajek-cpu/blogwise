/**
 * Content quality analyzer for SEO pipeline.
 * Scores generated markdown content before saving as draft.
 */

export interface QualityScore {
  overall: number           // 0-100
  wordCount: number
  keywordDensity: number    // percentage
  hasProperStructure: boolean  // has h1, h2, multiple sections
  sectionCount: number
  readabilityScore: number  // 0-100
  hasCallToAction: boolean
  hasConcreteData: boolean  // has numbers, dates, amounts
  issues: string[]          // list of quality issues found
  passed: boolean           // overall >= 60
}

const CTA_PATTERNS = [
  '신청하세요', '확인해보세요', '시작해보세요', '알아보세요',
  '방문해보세요', '클릭하세요', '참고하세요', '비교해보세요',
  '활용해보세요', '검토해보세요', '살펴보세요', '도전해보세요',
]

const CONCRETE_DATA_PATTERN = /(\d{1,3}(,\d{3})*|\d+)(원|만원|억원|%|년|월|일|개|명|회|배|점|만|천|백|달러|위안|엔)/

/**
 * Count Korean words / tokens in content.
 * Splits on whitespace and counts non-empty tokens.
 */
function countWords(text: string): number {
  return text
    .replace(/```[\s\S]*?```/g, '')  // strip code blocks
    .replace(/`[^`]*`/g, '')          // strip inline code
    .replace(/[#*>\[\]()_~]/g, ' ')  // strip markdown syntax
    .split(/\s+/)
    .filter((t) => t.length > 0).length
}

/**
 * Count keyword occurrences in plain text (case-insensitive).
 */
function countKeywordOccurrences(text: string, keyword: string): number {
  if (!keyword) return 0
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')
  return (text.match(regex) ?? []).length
}

/**
 * Calculate readability score (0-100) based on average sentence length.
 * Shorter sentences = higher score (better for web).
 * Target: 15-25 words per sentence.
 */
function calcReadabilityScore(text: string): number {
  const plainText = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/[#*>\[\]()_~]/g, '')

  const sentences = plainText
    .split(/[.!?。]\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5)

  if (sentences.length === 0) return 50

  const avgLen =
    sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0) /
    sentences.length

  // Ideal: 15-25 words. Penalize very long (>40) or very short (<5).
  if (avgLen >= 15 && avgLen <= 25) return 90
  if (avgLen >= 10 && avgLen < 15) return 80
  if (avgLen > 25 && avgLen <= 35) return 70
  if (avgLen > 35 && avgLen <= 40) return 55
  if (avgLen > 40) return 30
  return 60 // < 10 words avg
}

/**
 * Analyze generated content quality.
 * Checks: word count, keyword density, heading structure,
 * section variety, concrete data presence, readability.
 */
export function analyzeContentQuality(
  content: string,
  targetKeyword: string,
  targetWordCount = 1500
): QualityScore {
  const issues: string[] = []

  // --- Word count ---
  const wordCount = countWords(content)
  const minWords = Math.floor(targetWordCount * 0.7)
  const maxWords = Math.floor(targetWordCount * 1.5)

  // --- Heading structure ---
  const h1Matches = content.match(/^#\s+.+/gm) ?? []
  const h2Matches = content.match(/^##\s+.+/gm) ?? []
  const h3Matches = content.match(/^###\s+.+/gm) ?? []
  const sectionCount = h2Matches.length + h3Matches.length
  const hasProperStructure = h1Matches.length >= 1 && h2Matches.length >= 2

  // --- Keyword density ---
  const keywordOccurrences = countKeywordOccurrences(content, targetKeyword)
  const keywordDensity = wordCount > 0 ? (keywordOccurrences / wordCount) * 100 : 0

  // --- Readability ---
  const readabilityScore = calcReadabilityScore(content)

  // --- CTA check ---
  const lastSection = content.slice(Math.max(0, content.length - 500))
  const hasCallToAction = CTA_PATTERNS.some((cta) => lastSection.includes(cta))

  // --- Concrete data ---
  const hasConcreteData = CONCRETE_DATA_PATTERN.test(content)

  // --- Collect issues ---
  if (wordCount < minWords) {
    issues.push(`글자 수 부족: ${wordCount}자 (최소 ${minWords}자 권장)`)
  }
  if (wordCount > maxWords) {
    issues.push(`글자 수 초과: ${wordCount}자 (최대 ${maxWords}자 권장)`)
  }
  if (!hasProperStructure) {
    if (h1Matches.length === 0) issues.push('H1 제목(#) 없음')
    if (h2Matches.length < 2) issues.push(`H2 섹션 부족: ${h2Matches.length}개 (최소 2개 권장)`)
  }
  if (keywordDensity < 1.0) {
    issues.push(`키워드 밀도 낮음: ${keywordDensity.toFixed(2)}% (권장 1.5-3%)`)
  } else if (keywordDensity > 4.0) {
    issues.push(`키워드 과다 사용: ${keywordDensity.toFixed(2)}% (권장 1.5-3%)`)
  }
  if (!hasCallToAction) {
    issues.push('CTA(행동 유도 문구) 없음')
  }
  if (!hasConcreteData) {
    issues.push('구체적인 수치/날짜 데이터 없음')
  }
  if (readabilityScore < 50) {
    issues.push('가독성 낮음: 문장이 너무 길거나 짧음')
  }

  // --- Score calculation ---
  let overall = 100

  // Word count (max -25)
  if (wordCount < minWords) {
    overall -= Math.min(25, Math.round(((minWords - wordCount) / minWords) * 25))
  } else if (wordCount > maxWords) {
    overall -= 5
  }

  // Structure (max -20)
  if (!hasProperStructure) {
    if (h1Matches.length === 0) overall -= 10
    if (h2Matches.length < 2) overall -= 10
  }

  // Keyword density (max -15)
  if (keywordDensity < 1.0) {
    overall -= 15
  } else if (keywordDensity > 4.0) {
    overall -= 10
  }

  // Readability (max -15)
  overall -= Math.round(((100 - readabilityScore) / 100) * 15)

  // CTA (-10)
  if (!hasCallToAction) overall -= 10

  // Concrete data (-10)
  if (!hasConcreteData) overall -= 10

  // Section variety bonus
  if (sectionCount >= 5) overall = Math.min(100, overall + 5)

  overall = Math.max(0, Math.min(100, overall))

  return {
    overall,
    wordCount,
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    hasProperStructure,
    sectionCount,
    readabilityScore,
    hasCallToAction,
    hasConcreteData,
    issues,
    passed: overall >= 60,
  }
}
