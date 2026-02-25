import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { loadSiteSettings } from '@/lib/settings'
import { getAllTrends } from '@/lib/crawl/trends'
import { rankTopicsByRevenue, analyzeKeyword, type KeywordAnalysis } from '@/lib/crawl/analyzer'
import { crawlForKeyword } from '@/lib/crawl/crawler'
import { generateFeaturedImage, uploadImageToSupabase } from '@/lib/ai/gemini-image'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveApiKey, type SiteSettings } from '@/lib/settings'

// Allow up to 300 seconds for cron pipeline (multiple posts)
export const maxDuration = 300

const MOONSHOT_BASE_URL = 'https://api.moonshot.ai/v1'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

type ToneType = 'professional' | 'casual' | 'educational' | 'informative'

// ---- Shared helpers (duplicated from pipeline/route.ts to avoid importing route files) ----

function buildSystemPrompt(seoKeyword: string, wordCount: number, tone: ToneType): string {
  const toneDescriptions: Record<ToneType, string> = {
    professional: '전문적이고 권위 있는 톤',
    casual: '친근하고 대화하듯 편안한 톤',
    educational: '쉽게 설명하는 교육적인 톤',
    informative: '객관적이고 정보 전달 위주의 톤',
  }

  const personas = [
    '10년 경력의 전문 블로거',
    '해당 분야에서 실무 경험이 풍부한 현직자',
    '독자와 소통하는 것을 좋아하는 칼럼니스트',
    '쉬운 설명을 잘하는 교육 콘텐츠 전문가',
  ]
  const hash = seoKeyword.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const selectedPersona = personas[hash % personas.length]

  return `당신은 ${selectedPersona}입니다. ${toneDescriptions[tone]}으로 자연스러운 한국어 블로그 글을 작성하세요.

[핵심 원칙]
- 주제: "${seoKeyword}"
- 글의 모든 내용은 이 주제에 직접 관련되어야 합니다.

[자연스러운 글쓰기 - 절대 준수]
- 실제 사람이 자기 경험을 바탕으로 쓴 것처럼 작성하세요.
- 이모지는 쓰지 마세요.
- 반드시 한국어로만 작성하세요.

[구조]
1. 제목(h1): "${seoKeyword}"를 포함하되, 클릭하고 싶은 매력적인 제목
2. 도입부: 독자의 상황에 공감하며 시작 (1~2문단)
3. 본론: 3~5개 섹션
4. 마무리: 핵심 요약 + 독자에게 응원/조언 한마디
5. 목표 글자 수: 약 ${wordCount}자
6. 마크다운 형식 (h1/h2/h3, 리스트, 표, 강조 등)

[SEO]
- "${seoKeyword}"를 제목과 첫 문단에 포함
- 키워드 밀도 1.5~2.5% (자연스럽게)`
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\w\s가-힣-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() +
    '-' +
    Date.now()
  )
}

function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

function extractExcerpt(content: string, maxLength = 200): string {
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))
  const firstParagraph = lines[0] ?? ''
  if (firstParagraph.length <= maxLength) return firstParagraph
  return firstParagraph.substring(0, maxLength).trim() + '...'
}

function estimateReadTime(content: string): number {
  const charCount = content.replace(/\s/g, '').length
  return Math.max(1, Math.round(charCount / 500))
}

async function findOrCreateCategory(categoryName: string): Promise<string | null> {
  if (!isConfigured || !categoryName) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any
    const slug = categoryName.toLowerCase().replace(/[^\w\s가-힣-]/g, '').replace(/\s+/g, '-').trim()
    const { data: existing } = await db
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()
    if (existing) return existing.id

    const { data: newCat, error } = await db
      .from('categories')
      .insert({ name: categoryName, slug, description: `${categoryName} 관련 글`, post_count: 0 })
      .select('id')
      .single()
    if (error) return null
    return newCat.id
  } catch {
    return null
  }
}

async function generateContent(
  keyword: string,
  referenceContent: string | undefined,
  wordCount: number,
  tone: ToneType,
  dbSettings: SiteSettings
): Promise<{ content: string; model: string; inputTokens: number; outputTokens: number; generationTimeMs: number }> {
  const apiKey = await resolveApiKey('MOONSHOT_API_KEY', 'moonshot_api_key', dbSettings)
  if (!apiKey) throw new Error('MOONSHOT_API_KEY가 설정되지 않았습니다.')

  const model =
    process.env.MOONSHOT_MODEL ??
    (typeof dbSettings.moonshot_model === 'string' && dbSettings.moonshot_model
      ? dbSettings.moonshot_model
      : 'moonshot-v1-128k')

  const systemPrompt = buildSystemPrompt(keyword, wordCount, tone)
  const startTime = Date.now()

  const userMessage = referenceContent
    ? `반드시 "${keyword}"에 관한 블로그 글을 작성해주세요.\n\n주제: ${keyword}\n\n--- 참고 콘텐츠 ---\n${referenceContent}`
    : `반드시 "${keyword}"에 관한 블로그 글을 작성해주세요.\n\n주제: ${keyword}`

  const maxTokens = Math.min(Math.max(wordCount * 3, 4096), 16384)

  const response = await fetch(`${MOONSHOT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Moonshot API 오류 (${response.status}): ${errorData}`)
  }

  const data = await response.json()
  return {
    content: data.choices[0]?.message?.content ?? '',
    model: data.model ?? model,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    generationTimeMs: Date.now() - startTime,
  }
}

// ---- Cron handler ----

export async function GET(request: NextRequest) {
  // 1. Validate cron secret
  // Accept either Vercel cron header or query param secret
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const secret = request.nextUrl.searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET

  if (!isVercelCron && (!cronSecret || secret !== cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const errors: string[] = []

  try {
    // 2. Load settings to get pipeline config
    const settings = await loadSiteSettings()
    const count = Number(settings.auto_post_count) || 3
    const tone = (settings.default_tone as ToneType) || 'casual'
    const wordCount = Number(settings.default_word_count) || 2500

    console.log(`[cron/pipeline] Starting auto pipeline: count=${count}, tone=${tone}, wordCount=${wordCount}`)

    // 3. Fetch trends
    let trends
    try {
      trends = await getAllTrends()
    } catch (err) {
      const msg = `트렌드 수집 실패: ${err instanceof Error ? err.message : String(err)}`
      errors.push(msg)
      return NextResponse.json({ generated: 0, posts: [], errors, executionTimeMs: Date.now() - startTime }, { status: 500 })
    }

    // 4. Rank by revenue
    const ranked: KeywordAnalysis[] = await rankTopicsByRevenue(trends).catch(() => [])

    // 5. Deduplicate against existing posts
    let existingKeywords = new Set<string>()
    if (isConfigured) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = createAdminClient() as any
        const { data: existingPosts } = await db
          .from('posts')
          .select('title, seo_keywords')
          .limit(200)
        if (existingPosts) {
          for (const post of existingPosts) {
            const normalized = (post.title as string || '').toLowerCase().replace(/\s+/g, '')
            if (normalized) existingKeywords.add(normalized)
            const seoKws = post.seo_keywords as string[] | null
            if (seoKws) {
              for (const kw of seoKws) existingKeywords.add(kw.toLowerCase().replace(/\s+/g, ''))
            }
          }
        }
      } catch {
        console.log('[cron/pipeline] Could not fetch existing posts for dedup, continuing...')
      }
    }

    const fresh = ranked.filter(analysis => {
      const norm = analysis.keyword.toLowerCase().replace(/\s+/g, '')
      for (const existing of existingKeywords) {
        if (existing.includes(norm) || norm.includes(existing)) return false
      }
      return true
    })

    // 6. Weighted-random selection from top pool
    const pool = (fresh.length > 0 ? fresh : ranked).slice(0, count * 3)
    const topTopics: KeywordAnalysis[] = []
    const poolCopy = [...pool]
    for (let i = 0; i < Math.min(count, poolCopy.length); i++) {
      const weights = poolCopy.map((_, idx) => Math.max(1, poolCopy.length - idx))
      const totalWeight = weights.reduce((a, b) => a + b, 0)
      let rand = Math.random() * totalWeight
      let selectedIdx = 0
      for (let j = 0; j < weights.length; j++) {
        rand -= weights[j]
        if (rand <= 0) { selectedIdx = j; break }
      }
      topTopics.push(poolCopy[selectedIdx])
      poolCopy.splice(selectedIdx, 1)
    }

    // 7. Generate posts
    const generatedPosts: Array<{ id: string; title: string; slug: string; keyword: string; revenueScore: number }> = []

    for (const analysis of topTopics) {
      try {
        // Benchmark crawl
        let referenceContent: string | undefined
        try {
          const benchmarkArticles = await crawlForKeyword(analysis.keyword, 3)
          if (benchmarkArticles.length > 0) {
            referenceContent = benchmarkArticles
              .map((a, i) => `[참고${i + 1}] ${a.title}\n${a.content.substring(0, 2000)}`)
              .join('\n\n')
          }
        } catch (err) {
          console.log(`[cron/pipeline] Benchmark crawl failed for "${analysis.keyword}":`, err instanceof Error ? err.message : err)
        }

        const { content, model, inputTokens, outputTokens, generationTimeMs } =
          await generateContent(analysis.keyword, referenceContent, wordCount, tone, settings)

        const title = extractTitle(content, analysis.suggestedTitle)
        const slug = slugify(title)

        // Featured image
        let featuredImage: string | undefined
        try {
          const imgResult = await generateFeaturedImage(analysis.keyword, title, extractExcerpt(content))
          if (imgResult.imageUrl) {
            const uploadResult = await uploadImageToSupabase(imgResult.imageUrl, slug)
            if (uploadResult.url) {
              featuredImage = uploadResult.url
            } else {
              errors.push(`[이미지] "${analysis.keyword}" 업로드 실패: ${uploadResult.error}`)
            }
          } else {
            errors.push(`[이미지] "${analysis.keyword}" 생성 실패: ${imgResult.error ?? 'unknown'}`)
          }
        } catch (imgErr) {
          errors.push(`[이미지] "${analysis.keyword}" 예외: ${imgErr instanceof Error ? imgErr.message : String(imgErr)}`)
        }

        let postId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`

        if (isConfigured) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const db = createAdminClient() as any
          const categoryId = await findOrCreateCategory(analysis.suggestedCategory)

          const { data: post, error: postError } = await db
            .from('posts')
            .insert({
              title,
              slug,
              content,
              excerpt: extractExcerpt(content),
              read_time_minutes: estimateReadTime(content),
              featured_image: featuredImage ?? null,
              status: 'draft',
              seo_title: title,
              seo_description: `${analysis.keyword}에 대한 완벽 가이드`,
              seo_keywords: analysis.longTailVariants.slice(0, 5),
              ai_provider: 'moonshot',
              ai_model: model,
              category_id: categoryId,
            })
            .select('id')
            .single()

          if (postError) throw postError
          postId = post.id

          await db
            .from('ai_generation_logs')
            .insert({
              post_id: postId,
              provider: 'moonshot',
              model,
              prompt_template: 'cron_auto',
              prompt_variables: { keyword: analysis.keyword, mode: 'cron' },
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              generation_time_ms: generationTimeMs,
              status: 'completed',
            })
            .throwOnError()

          revalidatePath('/')
          revalidatePath('/posts')
        }

        generatedPosts.push({
          id: postId,
          title,
          slug,
          keyword: analysis.keyword,
          revenueScore: analysis.revenuePotential,
        })

        console.log(`[cron/pipeline] Generated: "${title}"`)
      } catch (err) {
        const msg = `"${analysis.keyword}" 생성 실패: ${err instanceof Error ? err.message : String(err)}`
        console.error(`[cron/pipeline] ${msg}`)
        errors.push(msg)
      }
    }

    const executionTimeMs = Date.now() - startTime
    console.log(`[cron/pipeline] Done in ${executionTimeMs}ms — generated=${generatedPosts.length}, errors=${errors.length}`)

    return NextResponse.json({
      generated: generatedPosts.length,
      posts: generatedPosts,
      errors,
      executionTimeMs,
    })
  } catch (error) {
    console.error('[cron/pipeline] Fatal error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '파이프라인 실행 중 오류가 발생했습니다.',
        errors,
        executionTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
