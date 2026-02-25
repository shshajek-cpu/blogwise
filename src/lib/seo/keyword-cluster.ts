/**
 * Keyword clustering for pillar-cluster content strategy.
 * Pure functions — no DB access.
 */

export interface KeywordCluster {
  pillarKeyword: string       // Main topic keyword
  pillarCategory: string
  clusterKeywords: string[]   // Related subtopic keywords
  totalRevenueScore: number
  contentCount: number        // Recommended number of articles for this cluster
}

/** Input shape expected by buildKeywordClusters. */
export interface KeywordInput {
  keyword: string
  category: string
  revenuePotential: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize a keyword for comparison: lowercase, strip spaces/punctuation. */
function normalize(keyword: string): string {
  return keyword.toLowerCase().replace(/[\s\-_.,!?]/g, '')
}

/**
 * Extract Korean stems of length >= 2 from a keyword.
 * Uses a sliding window of 2-char substrings over the normalized text.
 */
function extractStems(keyword: string): Set<string> {
  const norm = normalize(keyword)
  const stems = new Set<string>()
  // Add the whole normalized keyword
  stems.add(norm)
  // Add all 2-char and 3-char substrings (Korean morpheme approximation)
  for (let len = 2; len <= 3; len++) {
    for (let i = 0; i <= norm.length - len; i++) {
      stems.add(norm.slice(i, i + len))
    }
  }
  return stems
}

/**
 * Calculate stem overlap between two keywords.
 * Returns 0-1 where higher means more similar.
 */
function stemOverlap(a: string, b: string): number {
  const stemsA = extractStems(a)
  const stemsB = extractStems(b)
  let overlap = 0
  for (const s of stemsA) {
    if (stemsB.has(s)) overlap++
  }
  return overlap / Math.min(stemsA.size, stemsB.size)
}

/**
 * Decide whether two keywords belong to the same cluster.
 * Conditions: same category AND stem overlap >= 0.25.
 */
function areSameCluster(a: KeywordInput, b: KeywordInput): boolean {
  if (a.category !== b.category) return false
  return stemOverlap(a.keyword, b.keyword) >= 0.25
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Group analyzed keywords into topic clusters.
 * Keywords sharing the same category and overlapping terms are grouped.
 * Each cluster has a "pillar" (broadest/shortest keyword with highest revenue) and
 * "clusters" (specific long-tails).
 */
export function buildKeywordClusters(keywords: KeywordInput[]): KeywordCluster[] {
  if (keywords.length === 0) return []

  const assigned = new Set<number>()
  const clusters: KeywordCluster[] = []

  for (let i = 0; i < keywords.length; i++) {
    if (assigned.has(i)) continue

    const members: KeywordInput[] = [keywords[i]]
    assigned.add(i)

    for (let j = i + 1; j < keywords.length; j++) {
      if (assigned.has(j)) continue
      if (areSameCluster(keywords[i], keywords[j])) {
        members.push(keywords[j])
        assigned.add(j)
      }
    }

    // Select pillar: shortest keyword; tiebreak by highest revenuePotential
    const pillar = members.reduce((best, current) => {
      if (current.keyword.length < best.keyword.length) return current
      if (
        current.keyword.length === best.keyword.length &&
        current.revenuePotential > best.revenuePotential
      )
        return current
      return best
    })

    const clusterKeywords = members
      .filter((m) => m.keyword !== pillar.keyword)
      .map((m) => m.keyword)

    const totalRevenueScore = members.reduce((sum, m) => sum + m.revenuePotential, 0)

    // Recommend 1 pillar article + 1 per cluster keyword, clamped 1-7
    const contentCount = Math.min(7, Math.max(1, 1 + clusterKeywords.length))

    clusters.push({
      pillarKeyword: pillar.keyword,
      pillarCategory: pillar.category,
      clusterKeywords,
      totalRevenueScore,
      contentCount,
    })
  }

  // Sort by total revenue descending
  return clusters.sort((a, b) => b.totalRevenueScore - a.totalRevenueScore)
}

/**
 * For a given keyword, suggest whether it should be a pillar page or cluster article.
 * Pillar pages: shorter (<=4 tokens), more general.
 * Cluster articles: specific long-tail (>4 tokens or >15 chars).
 */
export function classifyContentRole(keyword: string, wordCount: number): 'pillar' | 'cluster' {
  const tokens = keyword.trim().split(/\s+/).filter(Boolean)
  const charLen = normalize(keyword).length

  // Explicit pillar signals: short keyword, low word count threshold
  if (tokens.length <= 2 && charLen <= 12) return 'pillar'
  if (tokens.length >= 4) return 'cluster'
  if (charLen > 15) return 'cluster'

  // Use the caller-supplied word count as a tiebreaker
  // (pillar pages tend to target higher volume = shorter keywords)
  return wordCount <= 2 ? 'pillar' : 'cluster'
}

/**
 * Get the recommended pillar page for a cluster keyword.
 * Finds the existing pillar keyword with the highest stem overlap.
 * Returns null if no sufficiently similar pillar is found (overlap < 0.2).
 */
export function findPillarForCluster(
  keyword: string,
  existingPillars: string[]
): string | null {
  if (existingPillars.length === 0) return null

  let bestPillar: string | null = null
  let bestScore = 0

  for (const pillar of existingPillars) {
    const score = stemOverlap(keyword, pillar)
    if (score > bestScore) {
      bestScore = score
      bestPillar = pillar
    }
  }

  return bestScore >= 0.2 ? bestPillar : null
}
