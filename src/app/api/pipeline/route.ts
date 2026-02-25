import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { rateLimit } from '@/lib/rateLimit'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getAllTrends } from '@/lib/crawl/trends'
import { analyzeKeyword, rankTopicsByRevenue, type KeywordAnalysis } from '@/lib/crawl/analyzer'
import { crawlForKeyword } from '@/lib/crawl/crawler'
import { generateFeaturedImage, uploadImageToSupabase } from '@/lib/ai/gemini-image'
import { loadSiteSettings, resolveApiKey, type SiteSettings } from '@/lib/settings'
import { checkDuplicate } from '@/lib/seo/duplicate-checker'
import { analyzeContentQuality } from '@/lib/seo/content-quality'
import { findRelatedPosts, injectInternalLinks } from '@/lib/seo/internal-links'
import { buildKeywordClusters, classifyContentRole } from '@/lib/seo/keyword-cluster'

// Allow up to 120 seconds for content + image generation
export const maxDuration = 120

const MOONSHOT_BASE_URL = 'https://api.moonshot.ai/v1'

const isConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

type ToneType = 'professional' | 'casual' | 'educational' | 'informative'

interface SystemPromptOptions {
  wordCount?: number
  tone?: ToneType
  persona?: string
  categoryStyle?: string
}

function buildSystemPrompt(
  seoKeyword: string,
  options: SystemPromptOptions = {}
): string {
  const {
    wordCount = 2500,
    tone = 'casual',
    persona: customPersona,
    categoryStyle
  } = options

  // Tone mapping to Korean descriptions
  const toneDescriptions: Record<ToneType, string> = {
    professional: '전문적이고 권위 있는 톤',
    casual: '친근하고 대화하듯 편안한 톤',
    educational: '쉽게 설명하는 교육적인 톤',
    informative: '객관적이고 정보 전달 위주의 톤',
  }

  // Rotate writing persona based on keyword for variety (unless custom persona provided)
  let selectedPersona: string
  if (customPersona) {
    selectedPersona = customPersona
  } else {
    const personas = [
      '10년 경력의 전문 블로거',
      '해당 분야에서 실무 경험이 풍부한 현직자',
      '독자와 소통하는 것을 좋아하는 칼럼니스트',
      '쉬운 설명을 잘하는 교육 콘텐츠 전문가',
    ]
    const hash = seoKeyword.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    selectedPersona = personas[hash % personas.length]
  }

  // Category-specific writing guidelines
  const categoryGuidelines: Record<string, string> = {
    '금융': `
[금융 카테고리 특화 가이드라인]
- 구체적 금액, 금리, 조건 수치를 반드시 포함하세요.
- 신뢰감 있는 톤을 유지하며, 정확한 정보 전달이 최우선입니다.
- 금융 용어는 쉽게 풀어서 설명하되, 전문성을 잃지 마세요.
- 주의사항, 리스크, 제한 조건을 명확히 안내하세요.`,

    '건강': `
[건강 카테고리 특화 가이드라인]
- 증상 → 원인 → 해결법 구조로 작성하세요.
- 의학 용어를 쉽게 풀어쓰되, 정확성을 유지하세요.
- 개인차가 있을 수 있음을 명시하고, 전문의 상담을 권장하세요.
- 근거 있는 정보만 제공하고, 과장된 표현을 피하세요.`,

    '부동산': `
[부동산 카테고리 특화 가이드라인]
- 절차, 서류, 비용을 구체적으로 안내하세요.
- 실무 경험을 바탕으로 한 톤을 사용하세요.
- 시기별, 지역별 차이점을 언급하세요.
- 세금, 수수료 등 숨은 비용도 명확히 안내하세요.`,

    '정부지원': `
[정부지원 카테고리 특화 가이드라인]
- 자격조건, 신청방법, 기간, 금액을 반드시 포함하세요.
- 단계별로 명확하게 설명하세요 (1단계, 2단계...).
- 필요 서류 목록을 구체적으로 제시하세요.
- 신청 기한, 마감일을 명확히 표시하세요.`,

    'IT/기술': `
[IT/기술 카테고리 특화 가이드라인]
- 예시 코드나 명령어를 포함하세요 (적절한 경우).
- 스크린샷 설명, 단계별 실습 위주로 작성하세요.
- 버전 정보, 호환성 정보를 명시하세요.
- 초보자도 따라할 수 있도록 상세히 설명하세요.`,

    '생활정보': `
[생활정보 카테고리 특화 가이드라인]
- 실생활에서 바로 적용할 수 있는 팁 위주로 작성하세요.
- 개인 경험담이나 사례를 풍부하게 포함하세요.
- 쉽고 간단한 방법을 우선 제시하세요.
- 비용 절감, 시간 단축 등 실질적 이점을 강조하세요.`,
  }

  const categoryGuide = categoryStyle ? (categoryGuidelines[categoryStyle] || '') : ''

  return `당신은 ${selectedPersona}입니다. ${toneDescriptions[tone]}으로 자연스러운 한국어 블로그 글을 작성하세요.

[핵심 원칙]
- 주제: "${seoKeyword}"
- 글의 모든 내용은 이 주제에 직접 관련되어야 합니다.
- 독자는 이 주제에 대한 실용적이고 구체적인 정보를 원합니다.
${categoryGuide}

[자연스러운 글쓰기 - 절대 준수]
- 실제 사람이 자기 경험을 바탕으로 쓴 것처럼 작성하세요.
- "~입니다", "~습니다"만 반복하지 말고, "~거든요", "~더라고요", "~인데요", "~잖아요" 등 구어체를 자연스럽게 섞어주세요.
- 첫 문장부터 독자의 공감을 끌어내세요. 예: "혹시 저만 이런 고민 했나요?", "솔직히 처음에는 막막했어요."
- 개인적인 경험담이나 일화를 자연스럽게 포함하세요. 예: "제가 직접 해보니까~", "주변에서 이런 경우를 많이 봤는데요"
- 중간중간 독자에게 말을 거는 톤을 사용하세요. 예: "여기서 중요한 건요,", "이 부분 놓치시면 안 돼요!"
- 완벽하게 정돈된 문장보다 약간의 구어적 표현이 더 자연스럽습니다.
- 문단 길이를 다양하게 하세요 (1줄짜리도, 5줄짜리도 섞어주세요).
- 이모지는 쓰지 마세요.
- 반드시 한국어로만 작성하세요. 중국어(한자), 일본어 등 다른 언어의 문자를 절대 사용하지 마세요. 예: "經濟", "金融" 같은 한자 표기 금지. 반드시 "경제", "금융"처럼 한글로만 쓰세요.

[절대 금지 - AI 티가 나는 표현]
- "오늘은 ~에 대해 알아보겠습니다" (금지! 너무 기계적)
- "~하는 것이 중요합니다" 반복 (금지! 단조로움)
- "결론적으로", "마지막으로 정리하자면" (금지! 교과서 스타일)
- "~할 수 있습니다", "~해야 합니다"만 반복 (금지!)
- "이 글에서는 ~를 다루겠습니다" (금지! 논문 스타일)
- 번호 목록만 나열하는 것 (설명과 섞어야 함)
- 모든 섹션이 같은 길이/구조 (변화를 주세요)

[구조]
1. 제목: # 제목 (마크다운 # 사용, "${seoKeyword}" 포함, 클릭하고 싶은 매력적인 제목)
2. 도입부: 독자의 상황에 공감하며 시작 (2~3문단)
3. 본론: 4~6개 섹션, 각 섹션마다 ## 소제목 사용, 각 섹션 최소 3문단, 다른 스타일로 (어떤 건 리스트, 어떤 건 이야기, 어떤 건 비교표)
4. 마무리: 핵심 요약 + 독자에게 응원/조언 한마디 (2~3문단)
5. 글자 수: 반드시 ${wordCount}자 이상 작성하세요. 짧은 글은 절대 안 됩니다.
6. 형식: 반드시 마크다운 문법만 사용 (제목은 #, 소제목은 ##, 소소제목은 ###, 리스트는 -, 강조는 **굵게**)
   - HTML 태그(h1, h2, p, div 등)는 절대 사용하지 마세요.
   - 마크다운 예시: # 제목, ## 소제목, ### 소소제목, - 리스트, **강조**

[SEO]
- "${seoKeyword}"를 제목과 첫 문단에 포함
- 소제목에 관련 키워드를 자연스럽게 배치
- 키워드 밀도 1.5~2.5% (자연스럽게)

[콘텐츠 품질]
- 구체적 정보: 금액, 기간, 자격 조건, 단계별 방법 등 수치와 팩트 포함
- 정부지원/금융 주제: 신청 자격, 금액, 기간, 절차, 서류를 반드시 포함
- 참고 콘텐츠가 있으면 더 낫게, 더 정확하게, 독창적으로 작성

[E-E-A-T 가이드라인 (Google 품질 기준)]
- 경험(Experience): 실제 경험담, 사례, "직접 해봤더니~" 스타일로 작성
- 전문성(Expertise): 해당 분야의 전문 용어를 적절히 사용하되 쉽게 설명
- 권위성(Authoritativeness): 공신력 있는 출처 언급 (정부 사이트, 공식 기관 등)
- 신뢰성(Trustworthiness): 정확한 수치, 날짜, 조건 포함. 불확실한 정보는 "확인 필요" 표기

[참고 링크 안내]
- 본문에서 독자에게 유용한 외부 링크를 2~4개 자연스럽게 포함하세요
- 정부지원/금융 주제: 정부24(gov.kr), 고용노동부, 복지로, 국민건강보험 등 공식 사이트 링크
- 기술/개발 주제: 공식 문서, GitHub 레포지토리, MDN 등 신뢰할 수 있는 기술 문서 링크
- 생활/건강 주제: 관련 정부 기관, 공신력 있는 기관 사이트 링크
- 링크 형식: 마크다운 [텍스트](URL) 형태로 자연스러운 문맥 안에 배치
- 예시: "자세한 내용은 [정부24 공식사이트](https://www.gov.kr)에서 확인할 수 있습니다."
- 존재하지 않는 URL이나 추측 URL은 절대 사용하지 마세요. 확실한 공식 사이트만 링크하세요`
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

async function findOrCreateCategory(categoryName: string): Promise<string | null> {
  if (!isConfigured || !categoryName) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any

    // Try to find existing category
    const slug = categoryName.toLowerCase().replace(/[^\w\s가-힣-]/g, '').replace(/\s+/g, '-').trim()
    const { data: existing } = await db
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) return existing.id

    // Create new category
    const { data: newCat, error } = await db
      .from('categories')
      .insert({
        name: categoryName,
        slug,
        description: `${categoryName} 관련 글`,
        post_count: 0,
      })
      .select('id')
      .single()

    if (error) {
      console.log(`[pipeline] Category create failed for "${categoryName}":`, error.message)
      return null
    }
    return newCat.id
  } catch (err) {
    console.log(`[pipeline] findOrCreateCategory error:`, err instanceof Error ? err.message : err)
    return null
  }
}

interface GenerateResult {
  content: string
  model: string
  inputTokens: number
  outputTokens: number
  generationTimeMs: number
}

function extractExcerpt(content: string, maxLength: number = 200): string {
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))
  const firstParagraph = lines[0] ?? ''
  if (firstParagraph.length <= maxLength) return firstParagraph
  return firstParagraph.substring(0, maxLength).trim() + '...'
}

function estimateReadTime(content: string): number {
  const charCount = content.replace(/\s/g, '').length
  // Korean reading speed: ~500 chars/min
  return Math.max(1, Math.round(charCount / 500))
}

interface GenerateOptions {
  wordCount?: number
  tone?: ToneType
  persona?: string
  categoryStyle?: string
}

async function generateContent(
  keyword: string,
  referenceContent?: string,
  options: GenerateOptions = {},
  dbSettings?: SiteSettings
): Promise<GenerateResult> {
  const apiKey = await resolveApiKey('MOONSHOT_API_KEY', 'moonshot_api_key', dbSettings)
  if (!apiKey) {
    throw new Error('MOONSHOT_API_KEY가 설정되지 않았습니다. 환경 변수 또는 관리자 설정에서 API 키를 입력해주세요.')
  }

  // Resolve model: env var MOONSHOT_MODEL > DB setting moonshot_model > default
  const model =
    process.env.MOONSHOT_MODEL ??
    (dbSettings && typeof dbSettings.moonshot_model === 'string' && dbSettings.moonshot_model
      ? dbSettings.moonshot_model
      : 'moonshot-v1-128k')

  const { wordCount = 2500, tone, persona, categoryStyle } = options

  const systemPrompt = buildSystemPrompt(keyword, {
    wordCount,
    tone,
    persona,
    categoryStyle,
  })
  const startTime = Date.now()

  const userMessage = referenceContent
    ? `반드시 "${keyword}"에 관한 블로그 글을 작성해주세요. 글의 모든 내용이 "${keyword}" 주제에 직접적으로 관련되어야 합니다. 아래 참고 콘텐츠를 벤치마킹하여 더 나은 품질의 글을 작성하되, 내용을 그대로 복사하지 말고 독창적으로 작성하세요.\n\n주제 (반드시 이 주제로만 작성): ${keyword}\n\n--- 참고 콘텐츠 ---\n${referenceContent}`
    : `반드시 "${keyword}"에 관한 블로그 글을 작성해주세요. 글의 모든 내용이 "${keyword}" 주제에 직접적으로 관련되어야 합니다. 주제와 무관한 내용은 포함하지 마세요.\n\n주제 (반드시 이 주제로만 작성): ${keyword}`

  // Adjust max_tokens based on wordCount: roughly wordCount * 3 tokens, capped at 16384
  const maxTokens = Math.min(Math.max(wordCount * 3, 4096), 16384)

  const response = await fetch(`${MOONSHOT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
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
  const rawContent = data.choices[0]?.message?.content ?? ''
  return {
    content: sanitizeContent(rawContent),
    model: data.model ?? model,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
    generationTimeMs: Date.now() - startTime,
  }
}

/**
 * Post-process AI content: remove stray foreign words, fix broken formatting.
 */
function sanitizeContent(content: string): string {
  let result = content
  // Remove isolated foreign words (English/Spanish/etc mixed into Korean sentences)
  // Matches: space + latin word + space in the middle of Korean text
  result = result.replace(/([가-힣])\s+[a-zA-Z]{3,20}\s+([가-힣])/g, '$1 $2')
  // Remove stray Chinese characters (but keep intentional terms in backticks)
  result = result.replace(/(?<!`)[\u4e00-\u9fff]+(?!`)/g, '')
  // Fix double spaces left by removals
  result = result.replace(/ {2,}/g, ' ')
  // Ensure markdown headings use # not HTML
  result = result.replace(/^<h1[^>]*>(.*?)<\/h1>/gim, '# $1')
  result = result.replace(/^<h2[^>]*>(.*?)<\/h2>/gim, '## $1')
  result = result.replace(/^<h3[^>]*>(.*?)<\/h3>/gim, '### $1')
  result = result.replace(/^h1[.>]\s*/gim, '# ')
  result = result.replace(/^h2[.>]\s*/gim, '## ')
  result = result.replace(/^h3[.>]\s*/gim, '### ')
  return result.trim()
}

interface GeneratedPost {
  id: string
  title: string
  slug: string
  keyword: string
  revenueScore: number
}

const MOCK_POSTS: GeneratedPost[] = [
  {
    id: 'mock-1',
    title: '정부지원금 신청방법 완벽 가이드 - 놓치지 마세요',
    slug: 'government-subsidy-guide',
    keyword: '정부지원금 신청방법',
    revenueScore: 87,
  },
  {
    id: 'mock-2',
    title: '소상공인 대출 조건 및 신청방법 총정리 (2026년)',
    slug: 'small-business-loan-guide',
    keyword: '소상공인 대출 조건',
    revenueScore: 82,
  },
]

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(request, { max: 5, windowMs: 60_000 })
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Auth check - capture userId for author_id on post inserts
    let userId: string | null = null
    if (isConfigured) {
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.warn('[pipeline] No authenticated user, proceeding anyway')
        } else {
          userId = user.id
        }
      } catch (authErr) {
        console.warn('[pipeline] Auth check failed:', authErr instanceof Error ? authErr.message : authErr)
      }
    }

    const body = await request.json()
    const {
      mode = 'auto',
      keyword,
      count = 3,
      tone = 'casual',
      wordCount = 2500,
      persona,
      categoryStyle,
    }: {
      mode: 'auto' | 'manual'
      keyword?: string
      count?: number
      tone?: ToneType
      wordCount?: number
      persona?: string
      categoryStyle?: string
    } = body

    if (mode === 'manual' && !keyword) {
      return NextResponse.json(
        { error: '수동 모드에서는 키워드가 필요합니다.' },
        { status: 400 }
      )
    }

    // Load DB settings once; used as fallback for API keys and model
    const dbSettings = await loadSiteSettings()

    // Check if AI key is configured (env or DB)
    const hasMoonshotKey = !!(process.env.MOONSHOT_API_KEY || dbSettings.moonshot_api_key)

    // Return mock if Supabase is not configured and no AI key
    if (!isConfigured && !hasMoonshotKey) {
      return NextResponse.json({
        generated: MOCK_POSTS.length,
        posts: MOCK_POSTS,
        errors: [],
        mock: true,
      })
    }

    // Early exit if no AI key — don't waste time crawling
    if (!hasMoonshotKey) {
      return NextResponse.json(
        { error: 'Moonshot API 키가 설정되지 않았습니다. 관리자 설정(Settings)에서 API 키를 입력해주세요.' },
        { status: 400 }
      )
    }

    const generatedPosts: GeneratedPost[] = []
    const errors: string[] = []

    if (mode === 'manual' && keyword) {
      // --- Manual mode: single keyword ---
      try {
        const analysis = await analyzeKeyword(keyword, 50)

        // Check for duplicate content
        let dupCheck = { isDuplicate: false, similarPosts: [] as Array<{ id: string; title: string; slug: string; similarity: number }>, recommendation: 'proceed' as 'skip' | 'proceed' | 'modify_angle' }
        try {
          dupCheck = await checkDuplicate(keyword, analysis.suggestedCategory)
        } catch (dupErr) {
          console.warn(`[pipeline] Duplicate check failed for "${keyword}":`, dupErr instanceof Error ? dupErr.message : dupErr)
        }

        if (dupCheck.isDuplicate && dupCheck.recommendation === 'skip') {
          errors.push(`"${keyword}" - 이미 유사한 콘텐츠가 존재합니다 (유사도: ${Math.round((dupCheck.similarPosts[0]?.similarity ?? 0) * 100)}%). 건너뜁니다.`)
        } else {
          let angleHint = ''
          if (dupCheck.recommendation === 'modify_angle' && dupCheck.similarPosts.length > 0) {
            angleHint = `\n\n참고: 이미 "${dupCheck.similarPosts[0].title}" 글이 있으므로, 다른 관점이나 최신 정보 위주로 차별화해서 작성하세요.`
          }

          // Benchmark: crawl top articles for this keyword (with 20s timeout)
          let referenceContent: string | undefined
          try {
            const crawlPromise = crawlForKeyword(keyword, 3)
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Benchmark crawl timeout (20s)')), 20000)
            )
            const benchmarkArticles = await Promise.race([crawlPromise, timeoutPromise])
            if (benchmarkArticles.length > 0) {
              referenceContent = benchmarkArticles
                .map((a, i) => `[참고${i + 1}] ${a.title}\n${a.content.substring(0, 2000)}`)
                .join('\n\n')
            }
          } catch (err) {
            console.log(`[pipeline] Benchmark crawl failed for "${keyword}":`, err instanceof Error ? err.message : err)
          }

          if (angleHint && referenceContent) {
            referenceContent = referenceContent + angleHint
          } else if (angleHint) {
            referenceContent = angleHint
          }

          const { content, model, inputTokens, outputTokens, generationTimeMs } =
            await generateContent(keyword, referenceContent, {
              wordCount,
              tone,
              persona,
              categoryStyle,
            }, dbSettings)

          // Quality check
          let quality = { passed: true, overall: 100, issues: [] as string[] }
          try {
            quality = analyzeContentQuality(content, keyword, wordCount)
            if (!quality.passed) {
              console.warn(`[pipeline] Quality check failed for "${keyword}": ${quality.issues.join(', ')}`)
            }
          } catch (qualErr) {
            console.warn(`[pipeline] Quality check error for "${keyword}":`, qualErr instanceof Error ? qualErr.message : qualErr)
          }

          const title = extractTitle(content, analysis.suggestedTitle)
          const slug = slugify(title)

          // Inject internal links for SEO
          let finalContent = content
          try {
            if (isConfigured) {
              const categoryId = await findOrCreateCategory(analysis.suggestedCategory)
              const relatedPosts = await findRelatedPosts(keyword, categoryId, slug)
              if (relatedPosts.length > 0) {
                finalContent = injectInternalLinks(content, relatedPosts)
              }
            }
          } catch (linkErr) {
            console.warn(`[pipeline] Internal link injection failed for "${keyword}":`, linkErr instanceof Error ? linkErr.message : linkErr)
          }

          // Generate featured image with Gemini (Nano Banana Pro)
          let featuredImage: string | undefined
          try {
            const imgResult = await generateFeaturedImage(keyword, title, extractExcerpt(content))
            if (imgResult.imageUrl) {
              const uploadResult = await uploadImageToSupabase(imgResult.imageUrl, slug)
              if (uploadResult.url) {
                featuredImage = uploadResult.url
              } else {
                errors.push(`[이미지] "${keyword}" 업로드 실패: ${uploadResult.error}`)
              }
            } else {
              errors.push(`[이미지] "${keyword}" 생성 실패: ${imgResult.error ?? 'unknown'}`)
            }
          } catch (imgErr) {
            errors.push(`[이미지] "${keyword}" 예외: ${imgErr instanceof Error ? imgErr.message : String(imgErr)}`)
          }

          let postId = `local-${Date.now()}`

          if (isConfigured) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const db = createAdminClient() as any

            // Resolve category
            const categoryId = await findOrCreateCategory(analysis.suggestedCategory)

            const { data: post, error: postError } = await db
              .from('posts')
              .insert({
                title,
                slug,
                content: finalContent,
                excerpt: extractExcerpt(content),
                read_time_minutes: estimateReadTime(content),
                featured_image: featuredImage ?? null,
                status: 'published',
                published_at: new Date().toISOString(),
                seo_title: title,
                seo_description: `${keyword}에 대한 완벽 가이드`,
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
                prompt_template: 'pipeline_auto',
                prompt_variables: {
                  keyword,
                  mode: 'manual',
                  qualityScore: quality.overall,
                  contentRole: classifyContentRole(keyword, keyword.split(/\s+/).length),
                  searchIntent: analysis.searchIntent,
                  duplicateCheck: dupCheck.recommendation,
                },
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                generation_time_ms: generationTimeMs,
                status: 'completed',
              })
              .throwOnError()

            // Revalidate pages for new content
            revalidatePath('/')
            revalidatePath('/posts')
          }

          generatedPosts.push({
            id: postId,
            title,
            slug,
            keyword,
            revenueScore: analysis.revenuePotential,
          })
        }
      } catch (err) {
        errors.push(
          `"${keyword}" 생성 실패: ${err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err))}`
        )
      }
    } else {
      // --- Auto mode: fetch trends, rank, generate top N ---
      let trends
      try {
        trends = await getAllTrends()
      } catch (err) {
        errors.push(
          `트렌드 수집 실패: ${err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err))}`
        )
        return NextResponse.json({
          generated: MOCK_POSTS.length,
          posts: MOCK_POSTS,
          errors,
          mock: true,
        })
      }

      // rankTopicsByRevenue returns KeywordAnalysis[] sorted by revenuePotential
      const ranked = await rankTopicsByRevenue(trends).catch(() => [])

      // Fetch existing post titles/keywords to avoid duplicates
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
              // Normalize title for fuzzy matching
              const normalized = (post.title as string || '')
                .toLowerCase().replace(/\s+/g, '')
              if (normalized) existingKeywords.add(normalized)
              // Also check seo_keywords array
              const seoKws = post.seo_keywords as string[] | null
              if (seoKws) {
                for (const kw of seoKws) {
                  existingKeywords.add(kw.toLowerCase().replace(/\s+/g, ''))
                }
              }
            }
          }
        } catch {
          console.log('[pipeline] Could not fetch existing posts for dedup, continuing...')
        }
      }

      // Filter out keywords that already have posts
      const fresh = ranked.filter(analysis => {
        const norm = analysis.keyword.toLowerCase().replace(/\s+/g, '')
        // Check if keyword is a substring of any existing title or vice versa
        for (const existing of existingKeywords) {
          if (existing.includes(norm) || norm.includes(existing)) return false
        }
        return true
      })

      // Pick from top candidates with randomization to avoid always selecting the same ones
      // Take a wider pool (top 3x count) and randomly sample from it
      const pool = (fresh.length > 0 ? fresh : ranked).slice(0, count * 3)

      // Build keyword clusters for topical authority
      const clusters = buildKeywordClusters(
        pool.map(r => ({ keyword: r.keyword, category: r.suggestedCategory, revenuePotential: r.revenuePotential }))
      )

      // Prefer selecting keywords from different clusters for content variety
      const seenClusterPillars = new Set<string>()
      const diversePool: KeywordAnalysis[] = []
      const remainderPool: KeywordAnalysis[] = []
      for (const item of pool) {
        const cluster = clusters.find(c =>
          c.pillarKeyword === item.keyword || c.clusterKeywords.includes(item.keyword)
        )
        const pillarKey = cluster?.pillarKeyword ?? item.keyword
        if (!seenClusterPillars.has(pillarKey)) {
          seenClusterPillars.add(pillarKey)
          diversePool.push(item)
        } else {
          remainderPool.push(item)
        }
      }
      // Fill up to pool size with remainder if diverse pool is smaller
      const reorderedPool = [...diversePool, ...remainderPool]

      const topTopics: KeywordAnalysis[] = []
      const poolCopy = [...reorderedPool]
      for (let i = 0; i < Math.min(count, poolCopy.length); i++) {
        // Weighted random: higher-ranked items get higher probability
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

      for (const analysis of topTopics) {
        try {
          // Check for duplicate content
          let dupCheck = { isDuplicate: false, similarPosts: [] as Array<{ id: string; title: string; slug: string; similarity: number }>, recommendation: 'proceed' as 'skip' | 'proceed' | 'modify_angle' }
          try {
            dupCheck = await checkDuplicate(analysis.keyword, analysis.suggestedCategory)
          } catch (dupErr) {
            console.warn(`[pipeline] Duplicate check failed for "${analysis.keyword}":`, dupErr instanceof Error ? dupErr.message : dupErr)
          }

          if (dupCheck.isDuplicate && dupCheck.recommendation === 'skip') {
            errors.push(`"${analysis.keyword}" - 이미 유사한 콘텐츠가 존재합니다 (유사도: ${Math.round((dupCheck.similarPosts[0]?.similarity ?? 0) * 100)}%). 건너뜁니다.`)
            continue
          }

          let angleHint = ''
          if (dupCheck.recommendation === 'modify_angle' && dupCheck.similarPosts.length > 0) {
            angleHint = `\n\n참고: 이미 "${dupCheck.similarPosts[0].title}" 글이 있으므로, 다른 관점이나 최신 정보 위주로 차별화해서 작성하세요.`
          }

          // Benchmark: crawl top articles for this keyword (with 20s timeout)
          let referenceContent: string | undefined
          try {
            const crawlPromise = crawlForKeyword(analysis.keyword, 3)
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Benchmark crawl timeout (20s)')), 20000)
            )
            const benchmarkArticles = await Promise.race([crawlPromise, timeoutPromise])
            if (benchmarkArticles.length > 0) {
              referenceContent = benchmarkArticles
                .map((a, i) => `[참고${i + 1}] ${a.title}\n${a.content.substring(0, 2000)}`)
                .join('\n\n')
            }
          } catch (err) {
            console.log(`[pipeline] Benchmark crawl failed for "${analysis.keyword}":`, err instanceof Error ? err.message : err)
          }

          if (angleHint && referenceContent) {
            referenceContent = referenceContent + angleHint
          } else if (angleHint) {
            referenceContent = angleHint
          }

          const { content, model, inputTokens, outputTokens, generationTimeMs } =
            await generateContent(analysis.keyword, referenceContent, {
              wordCount,
              tone,
              persona,
              categoryStyle,
            }, dbSettings)

          // Quality check
          let quality = { passed: true, overall: 100, issues: [] as string[] }
          try {
            quality = analyzeContentQuality(content, analysis.keyword, wordCount)
            if (!quality.passed) {
              console.warn(`[pipeline] Quality check failed for "${analysis.keyword}": ${quality.issues.join(', ')}`)
            }
          } catch (qualErr) {
            console.warn(`[pipeline] Quality check error for "${analysis.keyword}":`, qualErr instanceof Error ? qualErr.message : qualErr)
          }

          const title = extractTitle(content, analysis.suggestedTitle)
          const slug = slugify(title)

          // Inject internal links for SEO
          let finalContent = content
          try {
            if (isConfigured) {
              const categoryId = await findOrCreateCategory(analysis.suggestedCategory)
              const relatedPosts = await findRelatedPosts(analysis.keyword, categoryId, slug)
              if (relatedPosts.length > 0) {
                finalContent = injectInternalLinks(content, relatedPosts)
              }
            }
          } catch (linkErr) {
            console.warn(`[pipeline] Internal link injection failed for "${analysis.keyword}":`, linkErr instanceof Error ? linkErr.message : linkErr)
          }

          // Generate featured image with Gemini (Nano Banana Pro)
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

            // Resolve category
            const categoryId = await findOrCreateCategory(analysis.suggestedCategory)

            const { data: post, error: postError } = await db
              .from('posts')
              .insert({
                title,
                slug,
                content: finalContent,
                excerpt: extractExcerpt(content),
                read_time_minutes: estimateReadTime(content),
                featured_image: featuredImage ?? null,
                status: 'published',
                published_at: new Date().toISOString(),
                seo_title: title,
                seo_description: `${analysis.keyword}에 대한 완벽 가이드`,
                seo_keywords: analysis.longTailVariants.slice(0, 5),
                ai_provider: 'moonshot',
                ai_model: model,
                category_id: categoryId,
                // userId available for future author tracking
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
                prompt_template: 'pipeline_auto',
                prompt_variables: {
                  keyword: analysis.keyword,
                  mode: 'auto',
                  qualityScore: quality.overall,
                  contentRole: classifyContentRole(analysis.keyword, analysis.keyword.split(/\s+/).length),
                  searchIntent: analysis.searchIntent,
                  duplicateCheck: dupCheck.recommendation,
                },
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                generation_time_ms: generationTimeMs,
                status: 'completed',
              })
              .throwOnError()

            // Revalidate pages for new content
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
        } catch (err) {
          errors.push(
            `"${analysis.keyword}" 생성 실패: ${err instanceof Error ? err.message : (typeof err === 'object' && err !== null ? JSON.stringify(err) : String(err))}`
          )
        }
      }
    }

    return NextResponse.json({
      generated: generatedPosts.length,
      posts: generatedPosts,
      errors,
    })
  } catch (error) {
    console.error('Pipeline API error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '파이프라인 실행 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
