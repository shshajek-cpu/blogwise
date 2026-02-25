/**
 * Internal link injection for SEO.
 * Finds related published posts and injects natural link references into markdown.
 */

import { createAdminClient } from '@/lib/supabase/server'

export interface InternalLink {
  postId: string
  title: string
  slug: string
  relevanceScore: number
}

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/**
 * Find related published posts based on keyword and category.
 * Queries the Supabase `posts` table for published posts with similar keywords or same category.
 * Returns top N related posts sorted by relevance.
 */
export async function findRelatedPosts(
  keyword: string,
  categoryId: string | null,
  excludeSlug?: string,
  limit = 5
): Promise<InternalLink[]> {
  if (!isSupabaseConfigured()) return []

  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('posts')
      .select('id, title, slug, category_id, seo_keywords')
      .eq('status', 'published')
      .limit(100)

    if (error || !data) {
      console.error('[internal-links] findRelatedPosts error:', error?.message)
      return []
    }

    const normalizedKeyword = keyword.toLowerCase()
    const keywordTokens = normalizedKeyword.split(/\s+/).filter((t) => t.length >= 2)

    type PostRow = {
      id: string
      title: string
      slug: string
      category_id: string | null
      seo_keywords: string[] | null
    }

    const scored: InternalLink[] = (data as PostRow[])
      .filter((post) => post.slug !== excludeSlug)
      .map((post) => {
        let score = 0
        const titleLower = post.title.toLowerCase()

        // Weight 3: keyword found in title
        for (const token of keywordTokens) {
          if (titleLower.includes(token)) score += 3
        }
        if (titleLower.includes(normalizedKeyword)) score += 3

        // Weight 2: keyword found in seo_keywords array
        if (Array.isArray(post.seo_keywords)) {
          for (const kw of post.seo_keywords) {
            const kwLower = kw.toLowerCase()
            if (kwLower === normalizedKeyword) {
              score += 2
            } else {
              for (const token of keywordTokens) {
                if (kwLower.includes(token)) score += 2
              }
            }
          }
        }

        // Weight 1: same category
        if (categoryId && post.category_id === categoryId) score += 1

        return {
          postId: post.id,
          title: post.title,
          slug: post.slug,
          relevanceScore: score,
        }
      })
      .filter((link) => link.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    return scored
  } catch (err) {
    console.error('[internal-links] findRelatedPosts exception:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Inject internal links into markdown content.
 * Finds h2/h3 section boundaries and inserts natural Korean link references.
 * Injects 2-4 links maximum, spread across the content.
 */
export function injectInternalLinks(
  markdownContent: string,
  links: InternalLink[]
): string {
  if (links.length === 0) return markdownContent

  const linksToInject = links.slice(0, 4)

  // Split into lines for manipulation
  const lines = markdownContent.split('\n')
  const h2Positions: number[] = []

  for (let i = 0; i < lines.length; i++) {
    if (/^##\s/.test(lines[i]) || /^###\s/.test(lines[i])) {
      h2Positions.push(i)
    }
  }

  if (h2Positions.length < 2) {
    // Not enough sections — append a single link block at the end
    const linkBlock = buildLinkBlock(linksToInject.slice(0, 2))
    return markdownContent.trimEnd() + '\n\n' + linkBlock
  }

  // Determine injection points: after 2nd section and before last section
  const insertPositions: number[] = []

  // After the 2nd heading (index 1) — find the end of that section
  const secondHeadingIdx = h2Positions[1]
  const thirdHeadingIdx = h2Positions[2] ?? lines.length
  const midPoint = Math.floor((secondHeadingIdx + thirdHeadingIdx) / 2)
  insertPositions.push(midPoint)

  // Before the last heading
  const lastHeadingIdx = h2Positions[h2Positions.length - 1]
  if (lastHeadingIdx - 2 > midPoint) {
    insertPositions.push(lastHeadingIdx - 1)
  }

  // Split links across positions
  const splitIndex = Math.ceil(linksToInject.length / insertPositions.length)
  const chunks: InternalLink[][] = []
  for (let i = 0; i < linksToInject.length; i += splitIndex) {
    chunks.push(linksToInject.slice(i, i + splitIndex))
  }

  // Insert from end to start to preserve indices
  const sortedPositions = [...insertPositions]
    .map((pos, idx) => ({ pos, idx }))
    .sort((a, b) => b.pos - a.pos)

  for (const { pos, idx } of sortedPositions) {
    const chunk = chunks[idx] ?? chunks[chunks.length - 1]
    if (!chunk || chunk.length === 0) continue
    const block = buildLinkBlock(chunk)
    lines.splice(pos, 0, '', block, '')
  }

  return lines.join('\n')
}

function buildLinkBlock(links: InternalLink[]): string {
  if (links.length === 1) {
    return `**관련 글 추천**: [${links[0].title}](/posts/${links[0].slug})`
  }
  const items = links.map((l) => `- [${l.title}](/posts/${l.slug})`).join('\n')
  return `**관련 글 추천**\n\n${items}`
}
