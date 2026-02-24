// Crawl module barrel export
// Re-exports all public API from the crawl engine

// Trend detection
export type { TrendingTopic } from './trends'
export {
  fetchGoogleTrends,
  fetchNaverTrends,
  fetchDaumTrends,
  getAllTrends,
} from './trends'

// Content crawler
export type { CrawlOptions, CrawledContent } from './crawler'
export { crawlSource } from './crawler'

// Keyword analyzer
export type { KeywordAnalysis } from './analyzer'
export {
  analyzeKeyword,
  rankTopicsByRevenue,
  generateLongTailVariants,
} from './analyzer'

// Pipeline orchestration
export type { PipelineOptions, PipelineResult } from './pipeline'
export { runCrawlPipeline, crawlSingleSource } from './pipeline'
