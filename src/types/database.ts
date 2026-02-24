export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          role: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string | null
          post_count: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string | null
          post_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string | null
          post_count?: number
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string | null
          html_content: string | null
          featured_image: string | null
          category_id: string | null
          status: 'draft' | 'published' | 'scheduled' | 'archived'
          seo_title: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          ai_provider: string | null
          ai_model: string | null
          source_url: string | null
          view_count: number
          read_time_minutes: number | null
          published_at: string | null
          scheduled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt?: string | null
          content?: string | null
          html_content?: string | null
          featured_image?: string | null
          category_id?: string | null
          status?: 'draft' | 'published' | 'scheduled' | 'archived'
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          ai_provider?: string | null
          ai_model?: string | null
          source_url?: string | null
          view_count?: number
          read_time_minutes?: number | null
          published_at?: string | null
          scheduled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string | null
          content?: string | null
          html_content?: string | null
          featured_image?: string | null
          category_id?: string | null
          status?: 'draft' | 'published' | 'scheduled' | 'archived'
          seo_title?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          ai_provider?: string | null
          ai_model?: string | null
          source_url?: string | null
          view_count?: number
          read_time_minutes?: number | null
          published_at?: string | null
          scheduled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          post_count: number
        }
        Insert: {
          id?: string
          name: string
          slug: string
          post_count?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          post_count?: number
        }
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
      }
      crawl_sources: {
        Row: {
          id: string
          name: string
          platform: string
          url: string
          crawl_frequency: string | null
          is_active: boolean
          last_crawled_at: string | null
          total_items: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          platform: string
          url: string
          crawl_frequency?: string | null
          is_active?: boolean
          last_crawled_at?: string | null
          total_items?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          platform?: string
          url?: string
          crawl_frequency?: string | null
          is_active?: boolean
          last_crawled_at?: string | null
          total_items?: number
          created_at?: string
        }
      }
      crawled_items: {
        Row: {
          id: string
          source_id: string
          original_url: string
          title: string | null
          original_content: string | null
          original_html: string | null
          images: string[] | null
          metadata: Json | null
          is_used: boolean
          generated_post_id: string | null
          crawled_at: string
        }
        Insert: {
          id?: string
          source_id: string
          original_url: string
          title?: string | null
          original_content?: string | null
          original_html?: string | null
          images?: string[] | null
          metadata?: Json | null
          is_used?: boolean
          generated_post_id?: string | null
          crawled_at?: string
        }
        Update: {
          id?: string
          source_id?: string
          original_url?: string
          title?: string | null
          original_content?: string | null
          original_html?: string | null
          images?: string[] | null
          metadata?: Json | null
          is_used?: boolean
          generated_post_id?: string | null
          crawled_at?: string
        }
      }
      ai_generation_logs: {
        Row: {
          id: string
          post_id: string | null
          crawled_item_id: string | null
          provider: string
          model: string
          prompt_template: string | null
          prompt_variables: Json | null
          input_tokens: number | null
          output_tokens: number | null
          total_cost_usd: number | null
          generation_time_ms: number | null
          status: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          crawled_item_id?: string | null
          provider: string
          model: string
          prompt_template?: string | null
          prompt_variables?: Json | null
          input_tokens?: number | null
          output_tokens?: number | null
          total_cost_usd?: number | null
          generation_time_ms?: number | null
          status?: string
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          crawled_item_id?: string | null
          provider?: string
          model?: string
          prompt_template?: string | null
          prompt_variables?: Json | null
          input_tokens?: number | null
          output_tokens?: number | null
          total_cost_usd?: number | null
          generation_time_ms?: number | null
          status?: string
          error_message?: string | null
          created_at?: string
        }
      }
      site_settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          description?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          description?: string | null
          updated_at?: string
        }
      }
      page_views: {
        Row: {
          id: string
          post_id: string | null
          path: string
          referrer: string | null
          user_agent: string | null
          country: string | null
          device_type: string | null
          session_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          path: string
          referrer?: string | null
          user_agent?: string | null
          country?: string | null
          device_type?: string | null
          session_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          path?: string
          referrer?: string | null
          user_agent?: string | null
          country?: string | null
          device_type?: string | null
          session_id?: string | null
          viewed_at?: string
        }
      }
    }
    Enums: {
      post_status: 'draft' | 'published' | 'scheduled' | 'archived'
    }
    CompositeTypes: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type PostTag = Database['public']['Tables']['post_tags']['Row']
export type CrawlSource = Database['public']['Tables']['crawl_sources']['Row']
export type CrawledItem = Database['public']['Tables']['crawled_items']['Row']
export type AIGenerationLog = Database['public']['Tables']['ai_generation_logs']['Row']
export type SiteSettings = Database['public']['Tables']['site_settings']['Row']
export type PageView = Database['public']['Tables']['page_views']['Row']
