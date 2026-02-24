import type { CrawlSource, CrawledItem } from './database'

export type Platform =
  | 'naver_blog'
  | 'naver_news'
  | 'youtube'
  | 'tistory'
  | 'community'
  | 'generic'

export interface CrawlSourceWithStats extends CrawlSource {
  unused_items_count: number
  used_items_count: number
}

export interface CrawledItemWithSource extends CrawledItem {
  source: CrawlSource
}

export interface CreateCrawlSourceInput {
  name: string
  platform: Platform
  url: string
  crawl_frequency?: string | null
  is_active?: boolean
}

export interface CrawlResult {
  source_id: string
  items_found: number
  items_saved: number
  errors: string[]
  crawled_at: string
}
