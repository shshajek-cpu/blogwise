// Crawl Pipeline - orchestrates trend detection, analysis, and crawling
import { getAllTrends, fetchGoogleTrends, fetchNaverTrends, fetchDaumTrends } from './trends'
import type { TrendingTopic } from './trends'
import { rankTopicsByRevenue } from './analyzer'
import type { KeywordAnalysis } from './analyzer'
import { crawlSource } from './crawler'
import type { CrawlResult } from '@/types/crawl'
import { createClient } from '@/lib/supabase/server'

export interface PipelineOptions {
  trendSources?: ('google' | 'naver' | 'daum')[]
  maxTopics?: number
  minRevenueScore?: number
  crawlSources?: boolean
}

export interface PipelineResult {
  trendsFound: number
  topicsAnalyzed: number
  highValueTopics: KeywordAnalysis[]
  contentsCrawled: number
  errors: string[]
  executionTimeMs: number
}

const DEFAULT_MAX_TOPICS = 20
const DEFAULT_MIN_REVENUE_SCORE = 30

// ---- Helpers ----

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

async function fetchTrendsFromSources(
  sources: ('google' | 'naver' | 'daum')[]
): Promise<TrendingTopic[]> {
  const fetchers: Promise<TrendingTopic[]>[] = []
  if (sources.includes('google')) fetchers.push(fetchGoogleTrends())
  if (sources.includes('naver')) fetchers.push(fetchNaverTrends())
  if (sources.includes('daum')) fetchers.push(fetchDaumTrends())

  const results = await Promise.all(fetchers)
  const all = results.flat()

  // Deduplicate by normalized keyword
  const seen = new Set<string>()
  return all.filter((t) => {
    const key = t.keyword.toLowerCase().replace(/\s/g, '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function getActiveCrawlSources(): Promise<Array<{ id: string; url: string; platform: string; name: string }>> {
  if (!isSupabaseConfigured()) return []
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data, error } = await db
      .from('crawl_sources')
      .select('id, url, platform, name')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[pipeline] Error fetching crawl sources:', error.message)
      return []
    }
    return data ?? []
  } catch (err) {
    console.error('[pipeline] getActiveCrawlSources error:', err instanceof Error ? err.message : err)
    return []
  }
}

async function saveCrawledItemsToDb(
  sourceId: string,
  items: Awaited<ReturnType<typeof crawlSource>>
): Promise<number> {
  if (!isSupabaseConfigured() || items.length === 0) return 0
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const rows = items.map((item) => ({
      source_id: sourceId,
      original_url: item.url,
      title: item.title || null,
      original_content: item.content || null,
      original_html: item.html || null,
      images: item.images.length > 0 ? item.images : null,
      metadata: item.metadata,
      is_used: false,
      crawled_at: new Date().toISOString(),
    }))
    const { data, error } = await db
      .from('crawled_items')
      .upsert(rows, { onConflict: 'original_url', ignoreDuplicates: true })
      .select('id')
    if (error) {
      console.error('[pipeline] Error saving crawled items:', error.message)
      return 0
    }
    return (data ?? []).length
  } catch (err) {
    console.error('[pipeline] saveCrawledItemsToDb error:', err instanceof Error ? err.message : err)
    return 0
  }
}

// ---- Single Source Crawl ----

/**
 * Run crawl for a single registered source by source ID.
 */
export async function crawlSingleSource(sourceId: string): Promise<CrawlResult> {
  const crawledAt = new Date().toISOString()
  const errors: string[] = []

  console.log(`[pipeline] crawlSingleSource: ${sourceId}`)

  if (!isSupabaseConfigured()) {
    return { source_id: sourceId, items_found: 0, items_saved: 0, errors: ['Supabase가 설정되지 않았습니다.'], crawled_at: crawledAt }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: source, error: fetchError } = await db
    .from('crawl_sources')
    .select('*')
    .eq('id', sourceId)
    .single()

  if (fetchError || !source) {
    return {
      source_id: sourceId,
      items_found: 0,
      items_saved: 0,
      errors: [fetchError?.message ?? '소스를 찾을 수 없습니다.'],
      crawled_at: crawledAt,
    }
  }

  // Run the crawler
  let crawledItems: Awaited<ReturnType<typeof crawlSource>> = []
  try {
    crawledItems = await crawlSource({
      url: source.url,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      platform: source.platform as any,
      maxItems: 20,
    })
  } catch (err) {
    errors.push(`크롤링 실패: ${err instanceof Error ? err.message : String(err)}`)
  }

  console.log(`[pipeline] Source "${source.name}": ${crawledItems.length} items crawled`)

  // Save to database
  let itemsSaved = 0
  if (crawledItems.length > 0) {
    itemsSaved = await saveCrawledItemsToDb(sourceId, crawledItems)
    // Update last_crawled_at
    await db
      .from('crawl_sources')
      .update({
        last_crawled_at: new Date().toISOString(),
        total_items: source.total_items + itemsSaved,
      })
      .eq('id', sourceId)
  }

  return {
    source_id: sourceId,
    items_found: crawledItems.length,
    items_saved: itemsSaved,
    errors,
    crawled_at: crawledAt,
  }
}

// ---- Full Pipeline ----

/**
 * Run the full crawling pipeline:
 * 1. Fetch trends from selected sources
 * 2. Analyze and rank by revenue potential
 * 3. Filter by minimum revenue score
 * 4. Optionally crawl all active registered sources
 * 5. Persist results to Supabase if configured
 */
export async function runCrawlPipeline(options: PipelineOptions = {}): Promise<PipelineResult> {
  const startTime = Date.now()
  const errors: string[] = []
  let contentsCrawled = 0

  const {
    trendSources = ['google', 'naver', 'daum'],
    maxTopics = DEFAULT_MAX_TOPICS,
    minRevenueScore = DEFAULT_MIN_REVENUE_SCORE,
    crawlSources: shouldCrawlSources = false,
  } = options

  console.log(`[pipeline] Starting pipeline (sources: ${trendSources.join(', ')}, maxTopics: ${maxTopics}, minScore: ${minRevenueScore})`)

  // Step 1: Fetch trends
  let trends: TrendingTopic[] = []
  try {
    trends = trendSources.length === 3
      ? await getAllTrends()
      : await fetchTrendsFromSources(trendSources)
  } catch (err) {
    const msg = `트렌드 수집 실패: ${err instanceof Error ? err.message : String(err)}`
    console.error(`[pipeline] ${msg}`)
    errors.push(msg)
  }

  console.log(`[pipeline] Trends found: ${trends.length}`)

  // Step 2: Take top N by trend score, analyze revenue
  const topTrends = [...trends]
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, maxTopics)

  let rankedTopics: KeywordAnalysis[] = []
  try {
    rankedTopics = await rankTopicsByRevenue(topTrends)
  } catch (err) {
    const msg = `키워드 분석 실패: ${err instanceof Error ? err.message : String(err)}`
    console.error(`[pipeline] ${msg}`)
    errors.push(msg)
  }

  // Step 3: Filter by minimum revenue score
  const highValueTopics = rankedTopics.filter((t) => t.revenuePotential >= minRevenueScore)

  console.log(`[pipeline] High-value topics: ${highValueTopics.length} (>= score ${minRevenueScore})`)

  // Step 4: Save high-value trend metadata to Supabase crawled_items
  if (isSupabaseConfigured() && highValueTopics.length > 0) {
    try {
      const supabase = await createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      for (const analysis of highValueTopics) {
        const { error } = await db.from('crawled_items').upsert(
          {
            source_id: 'trend-pipeline',
            original_url: `https://trends.blogwise.internal/${encodeURIComponent(analysis.keyword)}`,
            title: analysis.suggestedTitle,
            original_content: analysis.longTailVariants.join('\n'),
            metadata: {
              keyword: analysis.keyword,
              revenuePotential: analysis.revenuePotential,
              estimatedCPC: analysis.estimatedCPC,
              category: analysis.suggestedCategory,
              competitionLevel: analysis.competitionLevel,
              searchVolumeEstimate: analysis.searchVolumeEstimate,
            },
            is_used: false,
            crawled_at: new Date().toISOString(),
          },
          { onConflict: 'original_url', ignoreDuplicates: true }
        )
        if (error) {
          errors.push(`저장 실패 (${analysis.keyword}): ${error.message}`)
        }
      }
    } catch (err) {
      errors.push(`DB 저장 실패: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Step 5: Optionally crawl registered content sources
  if (shouldCrawlSources) {
    try {
      const activeSources = await getActiveCrawlSources()
      console.log(`[pipeline] Crawling ${activeSources.length} registered sources...`)

      const BATCH_SIZE = 3
      for (let i = 0; i < activeSources.length; i += BATCH_SIZE) {
        const batch = activeSources.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.allSettled(
          batch.map((src) => crawlSingleSource(src.id))
        )
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            contentsCrawled += result.value.items_found
            if (result.value.errors.length > 0) errors.push(...result.value.errors)
          } else {
            errors.push(`소스 크롤 실패: ${result.reason}`)
          }
        }
      }
    } catch (err) {
      const msg = `소스 크롤링 오류: ${err instanceof Error ? err.message : String(err)}`
      console.error(`[pipeline] ${msg}`)
      errors.push(msg)
    }
  }

  const executionTimeMs = Date.now() - startTime
  console.log(
    `[pipeline] Complete in ${executionTimeMs}ms — ` +
    `trends=${trends.length}, analyzed=${rankedTopics.length}, ` +
    `highValue=${highValueTopics.length}, crawled=${contentsCrawled}, errors=${errors.length}`
  )

  return {
    trendsFound: trends.length,
    topicsAnalyzed: rankedTopics.length,
    highValueTopics,
    contentsCrawled,
    errors,
    executionTimeMs,
  }
}
