import type { Post, Category, Tag } from './database'

export type PostStatus = 'draft' | 'published' | 'scheduled' | 'archived'

export interface PostWithCategory extends Post {
  category: Category | null
}

export interface PostWithTags extends Post {
  tags: Tag[]
}

export interface PostFull extends Post {
  category: Category | null
  tags: Tag[]
}

export interface CreatePostInput {
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  html_content?: string | null
  featured_image?: string | null
  category_id?: string | null
  status?: PostStatus
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string[] | null
  ai_provider?: string | null
  ai_model?: string | null
  source_url?: string | null
  read_time_minutes?: number | null
  published_at?: string | null
  scheduled_at?: string | null
  tag_ids?: string[]
}

export interface UpdatePostInput extends Partial<CreatePostInput> {
  id: string
}
