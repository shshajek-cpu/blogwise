// Multi-Platform Content Crawler
// Supports: Naver Blog, Tistory, YouTube, Generic

import type { Platform } from '@/types/crawl'

export interface CrawlOptions {
  url: string
  platform: Platform
  maxItems?: number
}

export interface CrawledContent {
  url: string
  title: string
  content: string
  html?: string
  images: string[]
  author?: string
  publishedAt?: string
  metadata: Record<string, unknown>
}

const USER_AGENT = 'Blogwise-Bot/1.0'
const MAX_CONTENT_LENGTH = 50_000   // characters
const DEFAULT_MAX_ITEMS = 10
const FETCH_TIMEOUT_MS = 15_000

// ---- Helpers ----

/**
 * Fetch with timeout and proper User-Agent header.
 */
async function fetchPage(url: string, extraHeaders?: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        ...extraHeaders,
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!res.ok) {
      console.error(`[crawler] HTTP ${res.status} for ${url}`)
      return null
    }
    // Handle potential EUC-KR encoding by reading as text (fetch decodes based on Content-Type)
    return await res.text()
  } catch (err) {
    console.error(`[crawler] Fetch error for ${url}:`, err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Strip all HTML tags and decode common HTML entities.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Extract image URLs from HTML.
 */
function extractImages(html: string, baseUrl?: string): string[] {
  const images: string[] = []
  const pattern = /<img[^>]+src=["']([^"']+)["']/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(html)) !== null) {
    let src = match[1]
    if (src.startsWith('//')) src = 'https:' + src
    if (src.startsWith('/') && baseUrl) {
      try {
        const base = new URL(baseUrl)
        src = `${base.protocol}//${base.host}${src}`
      } catch {
        // ignore malformed URLs
      }
    }
    if (src.startsWith('http')) images.push(src)
  }
  // Deduplicate
  return [...new Set(images)].slice(0, 20)
}

/**
 * Extract a meta tag value from HTML.
 */
function extractMeta(html: string, name: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) return m[1].trim()
  }
  return undefined
}

/**
 * Extract page title from HTML.
 */
function extractTitle(html: string): string {
  const og = extractMeta(html, 'og:title')
  if (og) return og

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) return stripHtml(titleMatch[1]).trim()

  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
  if (h1Match) return stripHtml(h1Match[1]).trim()

  return 'Untitled'
}

/**
 * Extract main content text from HTML — prefer article/main blocks.
 */
function extractMainContent(html: string): string {
  // Try to find article or main content blocks
  const contentPatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]+class=["'][^"']*(?:content|post|article|body|entry)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ]

  for (const pattern of contentPatterns) {
    const m = html.match(pattern)
    if (m && m[1].length > 200) {
      return stripHtml(m[1]).substring(0, MAX_CONTENT_LENGTH)
    }
  }

  // Fallback: strip everything and return body text
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const text = stripHtml(bodyMatch ? bodyMatch[1] : html)
  return text.substring(0, MAX_CONTENT_LENGTH)
}

/**
 * Parse RSS/Atom XML and return array of item objects.
 */
function parseRssItems(xml: string): Array<{
  title: string
  link: string
  description: string
  pubDate?: string
  author?: string
}> {
  const items: Array<{ title: string; link: string; description: string; pubDate?: string; author?: string }> = []

  const itemPattern = /<item[\s>]([\s\S]*?)<\/item>/gi
  let itemMatch: RegExpExecArray | null

  while ((itemMatch = itemPattern.exec(xml)) !== null) {
    const block = itemMatch[1]

    const getTag = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))
        ?? block.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'))
      return m ? m[1].trim() : ''
    }

    const title = getTag('title')
    const link = getTag('link') || getTag('guid')
    const description = getTag('description') || getTag('content:encoded') || getTag('summary')
    const pubDate = getTag('pubDate') || getTag('published') || getTag('dc:date')
    const author = getTag('author') || getTag('dc:creator')

    if (title && link) {
      items.push({ title, link, description, pubDate: pubDate || undefined, author: author || undefined })
    }
  }

  return items
}

// ---- Platform-specific crawlers ----

/**
 * Crawl a Naver Blog by fetching its RSS feed.
 */
async function crawlNaverBlog(url: string, maxItems: number): Promise<CrawledContent[]> {
  console.log(`[crawler] Crawling Naver Blog: ${url}`)

  // Build RSS URL
  let rssUrl = url
  if (!rssUrl.endsWith('/rss')) {
    rssUrl = rssUrl.replace(/\/?$/, '/rss')
  }

  const xml = await fetchPage(rssUrl)
  if (!xml) return []

  const rssItems = parseRssItems(xml).slice(0, maxItems)
  const results: CrawledContent[] = []

  for (const item of rssItems) {
    const content = stripHtml(item.description).substring(0, MAX_CONTENT_LENGTH)
    const images = extractImages(item.description)

    results.push({
      url: item.link,
      title: item.title,
      content,
      html: item.description,
      images,
      author: item.author,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      metadata: { source: 'naver_blog', rssUrl },
    })
  }

  console.log(`[crawler] Naver Blog: ${results.length} items crawled`)
  return results
}

/**
 * Crawl a Tistory blog via its RSS feed.
 */
async function crawlTistory(url: string, maxItems: number): Promise<CrawledContent[]> {
  console.log(`[crawler] Crawling Tistory: ${url}`)

  // Normalize URL and append /rss
  let rssUrl = url.replace(/\/?$/, '/rss')

  const xml = await fetchPage(rssUrl)
  if (!xml) {
    // Some Tistory blogs use /feed
    rssUrl = url.replace(/\/?$/, '/feed')
    const xml2 = await fetchPage(rssUrl)
    if (!xml2) return []
    return parseTistoryRss(xml2, rssUrl, maxItems)
  }

  return parseTistoryRss(xml, rssUrl, maxItems)
}

function parseTistoryRss(xml: string, rssUrl: string, maxItems: number): CrawledContent[] {
  const rssItems = parseRssItems(xml).slice(0, maxItems)
  const results: CrawledContent[] = []

  for (const item of rssItems) {
    const content = stripHtml(item.description).substring(0, MAX_CONTENT_LENGTH)
    const images = extractImages(item.description)

    results.push({
      url: item.link,
      title: item.title,
      content,
      html: item.description,
      images,
      author: item.author,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      metadata: { source: 'tistory', rssUrl },
    })
  }

  console.log(`[crawler] Tistory: ${results.length} items crawled`)
  return results
}

/**
 * Crawl YouTube channel — uses API if YOUTUBE_API_KEY is set, otherwise parses channel page HTML.
 */
async function crawlYouTube(url: string, maxItems: number): Promise<CrawledContent[]> {
  console.log(`[crawler] Crawling YouTube: ${url}`)

  const apiKey = process.env.YOUTUBE_API_KEY

  // Extract channel ID or handle from URL
  const channelIdMatch = url.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/)
  const handleMatch = url.match(/\/@([a-zA-Z0-9_.-]+)/)

  if (apiKey && channelIdMatch) {
    return crawlYouTubeViaApi(channelIdMatch[1], apiKey, maxItems)
  }

  // Fallback: parse the YouTube channel page HTML
  const html = await fetchPage(url)
  if (!html) return []

  const results: CrawledContent[] = []

  // Extract video metadata from the page's JSON data
  const videoPattern = /"videoId":"([^"]+)","thumbnail"[\s\S]*?"title":\{"runs":\[\{"text":"([^"]+)"/g
  let match: RegExpExecArray | null
  let count = 0

  while ((match = videoPattern.exec(html)) !== null && count < maxItems) {
    const videoId = match[1]
    const title = match[2]
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

    results.push({
      url: videoUrl,
      title,
      content: title,
      images: [`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`],
      metadata: {
        source: 'youtube',
        videoId,
        channelUrl: url,
        handle: handleMatch ? handleMatch[1] : undefined,
      },
    })
    count++
  }

  console.log(`[crawler] YouTube (HTML fallback): ${results.length} items crawled`)
  return results
}

/**
 * Crawl YouTube via YouTube Data API v3.
 */
async function crawlYouTubeViaApi(
  channelId: string,
  apiKey: string,
  maxItems: number
): Promise<CrawledContent[]> {
  const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxItems}&order=date&type=video&key=${apiKey}`

  const html = await fetchPage(apiUrl)
  if (!html) return []

  try {
    const data = JSON.parse(html)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = data.items ?? []

    return items.map((item: any) => ({
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      title: item.snippet.title,
      content: item.snippet.description ?? '',
      images: item.snippet.thumbnails?.high?.url
        ? [item.snippet.thumbnails.high.url]
        : [],
      author: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      metadata: {
        source: 'youtube',
        videoId: item.id.videoId,
        channelId,
        channelTitle: item.snippet.channelTitle,
      },
    }))
  } catch (err) {
    console.error('[crawler] YouTube API parse error:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Generic crawler: fetch URL, parse HTML for title, content, and images.
 */
async function crawlGeneric(url: string, maxItems: number): Promise<CrawledContent[]> {
  console.log(`[crawler] Generic crawl: ${url}`)

  const html = await fetchPage(url)
  if (!html) return []

  const title = extractTitle(html)
  const content = extractMainContent(html)
  const images = extractImages(html, url)

  const author = extractMeta(html, 'author') ?? extractMeta(html, 'article:author')
  const publishedAt = extractMeta(html, 'article:published_time')
    ?? extractMeta(html, 'og:updated_time')

  const description = extractMeta(html, 'description') ?? extractMeta(html, 'og:description')

  // Try to find RSS links in the page and crawl those too
  const rssLinkMatch = html.match(/<link[^>]+type=["']application\/rss\+xml["'][^>]+href=["']([^"']+)["']/i)
  if (rssLinkMatch && maxItems > 1) {
    let rssUrl = rssLinkMatch[1]
    if (rssUrl.startsWith('/')) {
      try {
        const base = new URL(url)
        rssUrl = `${base.protocol}//${base.host}${rssUrl}`
      } catch {
        // ignore
      }
    }
    const rssXml = await fetchPage(rssUrl)
    if (rssXml) {
      const rssItems = parseRssItems(rssXml).slice(0, maxItems)
      const rssResults: CrawledContent[] = rssItems.map((item) => ({
        url: item.link,
        title: item.title,
        content: stripHtml(item.description).substring(0, MAX_CONTENT_LENGTH),
        html: item.description,
        images: extractImages(item.description),
        author: item.author,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
        metadata: { source: 'generic_rss', rssUrl, parentUrl: url },
      }))
      if (rssResults.length > 0) {
        console.log(`[crawler] Generic RSS: ${rssResults.length} items crawled`)
        return rssResults
      }
    }
  }

  console.log(`[crawler] Generic: 1 page crawled`)
  return [
    {
      url,
      title,
      content,
      html: html.substring(0, MAX_CONTENT_LENGTH),
      images,
      author,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
      metadata: {
        source: 'generic',
        description,
        ogTitle: extractMeta(html, 'og:title'),
        ogImage: extractMeta(html, 'og:image'),
      },
    },
  ]
}

// ---- Main crawler dispatcher ----

/**
 * Crawl a source URL using the appropriate platform-specific crawler.
 */
export async function crawlSource(options: CrawlOptions): Promise<CrawledContent[]> {
  const { url, platform, maxItems = DEFAULT_MAX_ITEMS } = options

  console.log(`[crawler] crawlSource: platform=${platform} url=${url} maxItems=${maxItems}`)

  try {
    switch (platform) {
      case 'naver_blog':
      case 'naver_news':
        return await crawlNaverBlog(url, maxItems)

      case 'tistory':
        return await crawlTistory(url, maxItems)

      case 'youtube':
        return await crawlYouTube(url, maxItems)

      case 'generic':
      case 'community':
      default:
        return await crawlGeneric(url, maxItems)
    }
  } catch (err) {
    console.error(`[crawler] Unhandled error for ${url}:`, err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Search the web for a keyword and crawl top-ranking content.
 * Uses Naver Search API if available, otherwise falls back to Google search scraping.
 * Returns crawled content from top articles that AI can use as reference.
 */
export async function crawlForKeyword(keyword: string, maxResults: number = 5): Promise<CrawledContent[]> {
  console.log(`[crawler] crawlForKeyword: "${keyword}" (max ${maxResults})`)

  const results: CrawledContent[] = []

  // Strategy 1: Try Naver Blog Search API
  const naverClientId = process.env.NAVER_CLIENT_ID
  const naverClientSecret = process.env.NAVER_CLIENT_SECRET

  if (naverClientId && naverClientSecret) {
    try {
      const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&sort=sim&display=${maxResults}`
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'X-Naver-Client-Id': naverClientId,
          'X-Naver-Client-Secret': naverClientSecret,
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })

      if (res.ok) {
        const data = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: any[] = data.items ?? []

        for (const item of items) {
          const title = stripHtml(item.title)
          const content = stripHtml(item.description)

          results.push({
            url: item.link,
            title,
            content,
            images: [],
            metadata: { source: 'naver_search', keyword, blogger: item.bloggername },
          })
        }

        if (results.length > 0) {
          console.log(`[crawler] Naver Search: ${results.length} results for "${keyword}"`)

          // For top 3 results, try to fetch full content
          for (let i = 0; i < Math.min(3, results.length); i++) {
            try {
              const fullHtml = await fetchPage(results[i].url)
              if (fullHtml) {
                const fullContent = extractMainContent(fullHtml)
                if (fullContent.length > results[i].content.length) {
                  results[i].content = fullContent
                  results[i].images = extractImages(fullHtml, results[i].url)
                }
              }
            } catch {
              // Keep the snippet content
            }
          }

          return results
        }
      }
    } catch (err) {
      console.error(`[crawler] Naver search error:`, err instanceof Error ? err.message : err)
    }
  }

  // Strategy 2: Search via Google (scrape search results page)
  try {
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=kr&num=${maxResults}`
    const html = await fetchPage(googleUrl, {
      'Accept-Language': 'ko-KR,ko;q=0.9',
    })

    if (html) {
      // Extract search result URLs
      const linkPattern = /<a[^>]+href="\/url\?q=([^&"]+)/g
      let match: RegExpExecArray | null
      const urls: string[] = []

      while ((match = linkPattern.exec(html)) !== null && urls.length < maxResults) {
        const decoded = decodeURIComponent(match[1])
        if (decoded.startsWith('http') && !decoded.includes('google.com') && !decoded.includes('youtube.com/watch')) {
          urls.push(decoded)
        }
      }

      // Also try direct href pattern
      if (urls.length === 0) {
        const directPattern = /href="(https?:\/\/(?!www\.google|accounts\.google|support\.google|maps\.google)[^"]+)"/g
        while ((match = directPattern.exec(html)) !== null && urls.length < maxResults) {
          const url = match[1]
          if (!url.includes('google.com') && !url.includes('gstatic.com')) {
            urls.push(url)
          }
        }
      }

      console.log(`[crawler] Google search: found ${urls.length} URLs for "${keyword}"`)

      // Crawl each result page
      for (const url of urls.slice(0, maxResults)) {
        try {
          const pageHtml = await fetchPage(url)
          if (!pageHtml) continue

          const title = extractTitle(pageHtml)
          const content = extractMainContent(pageHtml)
          const images = extractImages(pageHtml, url)

          if (content.length > 100) {
            results.push({
              url,
              title,
              content: content.substring(0, MAX_CONTENT_LENGTH),
              images,
              metadata: { source: 'google_search', keyword },
            })
          }
        } catch {
          continue
        }
      }
    }
  } catch (err) {
    console.error(`[crawler] Google search error:`, err instanceof Error ? err.message : err)
  }

  // Strategy 3: If still no results, try Naver web search (no API key needed, scrape)
  if (results.length === 0) {
    try {
      const naverUrl = `https://search.naver.com/search.naver?query=${encodeURIComponent(keyword)}&where=view`
      const html = await fetchPage(naverUrl)

      if (html) {
        // Extract blog post URLs from Naver search results
        const blogPattern = /href="(https?:\/\/(?:blog\.naver\.com|m\.blog\.naver\.com|[^"]+\.tistory\.com)[^"]+)"/g
        let match: RegExpExecArray | null
        const urls: string[] = []

        while ((match = blogPattern.exec(html)) !== null && urls.length < maxResults) {
          urls.push(match[1])
        }

        for (const url of urls) {
          try {
            const pageHtml = await fetchPage(url)
            if (!pageHtml) continue

            const title = extractTitle(pageHtml)
            const content = extractMainContent(pageHtml)

            if (content.length > 100) {
              results.push({
                url,
                title,
                content: content.substring(0, MAX_CONTENT_LENGTH),
                images: extractImages(pageHtml, url),
                metadata: { source: 'naver_web_search', keyword },
              })
            }
          } catch {
            continue
          }
        }

        console.log(`[crawler] Naver web search: ${results.length} results for "${keyword}"`)
      }
    } catch (err) {
      console.error(`[crawler] Naver web search error:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`[crawler] crawlForKeyword complete: ${results.length} articles for "${keyword}"`)
  return results
}
