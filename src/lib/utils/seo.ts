import type { Metadata } from 'next'

interface GenerateMetadataOptions {
  title: string
  description?: string | null
  keywords?: string[] | null
  image?: string | null
  url?: string
  type?: 'website' | 'article'
  publishedAt?: string | null
  modifiedAt?: string | null
  noIndex?: boolean
}

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Blogwise'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'

/**
 * Generates Next.js Metadata object for a page.
 */
export function generateMetadata(options: GenerateMetadataOptions): Metadata {
  const {
    title,
    description,
    keywords,
    image,
    url,
    type = 'website',
    publishedAt,
    modifiedAt,
    noIndex = false,
  } = options

  const fullTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`

  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL

  const metadata: Metadata = {
    title: fullTitle,
    description: description ?? undefined,
    keywords: keywords ?? undefined,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description: description ?? undefined,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type,
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: title }]
        : undefined,
      ...(publishedAt && { publishedTime: publishedAt }),
      ...(modifiedAt && { modifiedTime: modifiedAt }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description ?? undefined,
      images: image ? [image] : undefined,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }

  return metadata
}

interface ArticleJsonLdOptions {
  title: string
  description?: string | null
  url: string
  image?: string | null
  publishedAt?: string | null
  modifiedAt?: string | null
  authorName?: string
}

interface WebSiteJsonLdOptions {
  name?: string
  url?: string
  description?: string
}

/**
 * Generates JSON-LD structured data for an Article or WebSite.
 */
export function generateJsonLd(
  type: 'Article',
  options: ArticleJsonLdOptions
): Record<string, unknown>
export function generateJsonLd(
  type: 'WebSite',
  options?: WebSiteJsonLdOptions
): Record<string, unknown>
export function generateJsonLd(
  type: 'Article' | 'WebSite',
  options: ArticleJsonLdOptions | WebSiteJsonLdOptions = {}
): Record<string, unknown> {
  if (type === 'Article') {
    const o = options as ArticleJsonLdOptions
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: o.title,
      description: o.description ?? undefined,
      url: `${SITE_URL}${o.url}`,
      image: o.image ?? undefined,
      datePublished: o.publishedAt ?? undefined,
      dateModified: o.modifiedAt ?? o.publishedAt ?? undefined,
      author: {
        '@type': 'Person',
        name: o.authorName ?? SITE_NAME,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
    }
  }

  // WebSite
  const o = options as WebSiteJsonLdOptions
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: o.name ?? SITE_NAME,
    url: o.url ?? SITE_URL,
    description: o.description ?? undefined,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${o.url ?? SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
