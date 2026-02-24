export interface DailyStats {
  date: string
  views: number
  unique_visitors: number
  new_posts: number
}

export interface TrafficData {
  date: string
  views: number
  referrer: string | null
  country: string | null
  device_type: string | null
}

export interface PopularPost {
  id: string
  title: string
  slug: string
  view_count: number
  published_at: string | null
  featured_image: string | null
  category_name: string | null
}

export interface AnalyticsSummary {
  total_views: number
  total_posts: number
  published_posts: number
  draft_posts: number
  total_categories: number
  total_tags: number
  views_today: number
  views_this_week: number
  views_this_month: number
  popular_posts: PopularPost[]
  daily_stats: DailyStats[]
  top_referrers: Array<{ referrer: string; count: number }>
  device_breakdown: Array<{ device_type: string; count: number }>
  country_breakdown: Array<{ country: string; count: number }>
}
