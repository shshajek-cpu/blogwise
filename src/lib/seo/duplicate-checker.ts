/**
 * Duplicate content checker for SEO pipeline.
 * Prevents generating posts that are too similar to existing published content.
 */

import { createAdminClient } from '@/lib/supabase/server'

export interface DuplicateCheckResult {
  isDuplicate: boolean
  similarPosts: Array<{ id: string; title: string; slug: string; similarity: number }>
  recommendation: 'skip' | 'proceed' | 'modify_angle'
}

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/** Normalize a keyword for comparison: lowercase, remove spaces and punctuation. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s\-_.,!?]/g, '')
}

/** Extract token set: split on spaces, filter tokens >= 2 chars. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^\w가-힣]/g, ''))
    .filter((t) => t.length >= 2)
}

/**
 * Calculate overlap similarity between two token sets.
 * Returns 0-1 where 1 is identical.
 */
function overlapSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0
  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  let overlap = 0
  for (const t of setA) {
    if (setB.has(t)) overlap++
  }
  return overlap / Math.min(setA.size, setB.size)
}

/**
 * Check if a keyword/topic already has similar content.
 * Uses multiple strategies:
 * 1. Exact keyword match in seo_keywords array
 * 2. Title similarity using normalized substring matching
 * 3. Category + keyword overlap check
 * Returns recommendation: skip if >80% similar, modify_angle if 50-80%, proceed if <50%
 */
export async function checkDuplicate(
  keyword: string,
  category?: string
): Promise<DuplicateCheckResult> {
  if (!isSupabaseConfigured()) {
    return { isDuplicate: false, similarPosts: [], recommendation: 'proceed' }
  }

  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('posts')
      .select('id, title, slug, seo_keywords, category_id')
      .in('status', ['published', 'draft', 'scheduled'])
      .limit(500)

    if (error || !data) {
      console.error('[duplicate-checker] checkDuplicate error:', error?.message)
      return { isDuplicate: false, similarPosts: [], recommendation: 'proceed' }
    }

    const normalizedKeyword = normalize(keyword)
    const keywordTokens = tokenize(keyword)

    type PostRow = {
      id: string
      title: string
      slug: string
      seo_keywords: string[] | null
      category_id: string | null
    }

    const results: Array<{ id: string; title: string; slug: string; similarity: number }> = []

    for (const post of data as PostRow[]) {
      let maxSimilarity = 0

      // Strategy 1: exact keyword match in seo_keywords
      if (Array.isArray(post.seo_keywords)) {
        for (const kw of post.seo_keywords) {
          if (normalize(kw) === normalizedKeyword) {
            maxSimilarity = Math.max(maxSimilarity, 1.0)
          } else {
            const sim = overlapSimilarity(keywordTokens, tokenize(kw))
            maxSimilarity = Math.max(maxSimilarity, sim)
          }
        }
      }

      // Strategy 2: title similarity
      const titleNorm = normalize(post.title)
      if (titleNorm.includes(normalizedKeyword) || normalizedKeyword.includes(titleNorm)) {
        maxSimilarity = Math.max(maxSimilarity, 0.9)
      } else {
        const titleSim = overlapSimilarity(keywordTokens, tokenize(post.title))
        maxSimilarity = Math.max(maxSimilarity, titleSim)
      }

      // Strategy 3: category bonus — same category raises similarity slightly
      if (category && post.category_id === category && maxSimilarity > 0.3) {
        maxSimilarity = Math.min(1.0, maxSimilarity + 0.1)
      }

      if (maxSimilarity >= 0.5) {
        results.push({
          id: post.id,
          title: post.title,
          slug: post.slug,
          similarity: Math.round(maxSimilarity * 100) / 100,
        })
      }
    }

    results.sort((a, b) => b.similarity - a.similarity)
    const topResults = results.slice(0, 5)
    const highestSimilarity = topResults[0]?.similarity ?? 0

    let recommendation: 'skip' | 'proceed' | 'modify_angle'
    let isDuplicate = false

    if (highestSimilarity >= 0.8) {
      recommendation = 'skip'
      isDuplicate = true
    } else if (highestSimilarity >= 0.5) {
      recommendation = 'modify_angle'
      isDuplicate = false
    } else {
      recommendation = 'proceed'
      isDuplicate = false
    }

    return { isDuplicate, similarPosts: topResults, recommendation }
  } catch (err) {
    console.error('[duplicate-checker] checkDuplicate exception:', err instanceof Error ? err.message : err)
    return { isDuplicate: false, similarPosts: [], recommendation: 'proceed' }
  }
}
