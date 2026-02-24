-- =============================================
-- BlogWise Safe Migration (IF NOT EXISTS)
-- 이미 존재하는 테이블은 건너뜁니다
-- Supabase SQL Editor에서 실행하세요
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 001: Initial Schema ─────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#2563EB',
  post_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  post_count INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON public.tags(slug);

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  html_content TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[] DEFAULT '{}',
  ai_provider TEXT,
  ai_model TEXT,
  source_url TEXT,
  view_count INT NOT NULL DEFAULT 0,
  read_time_minutes INT DEFAULT 5,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published_at DESC) WHERE status = 'published';

CREATE TABLE IF NOT EXISTS public.post_tags (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ─── 002: Crawl Tables ───────────────────────

CREATE TABLE IF NOT EXISTS public.crawl_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('naver_blog', 'naver_news', 'youtube', 'tistory', 'community', 'generic')),
  url TEXT NOT NULL,
  crawl_frequency TEXT DEFAULT 'daily' CHECK (crawl_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_crawled_at TIMESTAMPTZ,
  total_items INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crawled_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.crawl_sources(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  original_content TEXT,
  original_html TEXT,
  images TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  is_used BOOLEAN NOT NULL DEFAULT false,
  generated_post_id UUID REFERENCES public.posts(id),
  crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crawled_source ON public.crawled_items(source_id);
CREATE INDEX IF NOT EXISTS idx_crawled_url ON public.crawled_items(original_url);
CREATE INDEX IF NOT EXISTS idx_crawled_unused ON public.crawled_items(is_used) WHERE is_used = false;

-- ─── 003: AI Tables ──────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id),
  crawled_item_id UUID REFERENCES public.crawled_items(id),
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'claude', 'gemini', 'moonshot')),
  model TEXT NOT NULL,
  prompt_template TEXT,
  prompt_variables JSONB,
  input_tokens INT,
  output_tokens INT,
  total_cost_usd NUMERIC(10, 6),
  generation_time_ms INT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 004: Analytics Tables ───────────────────

CREATE TABLE IF NOT EXISTS public.page_views (
  id BIGSERIAL PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  session_id TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_views_post ON public.page_views(post_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON public.page_views(viewed_at);

-- Materialized view (drop and recreate if needed)
DROP MATERIALIZED VIEW IF EXISTS public.daily_stats;
CREATE MATERIALIZED VIEW public.daily_stats AS
SELECT
  date_trunc('day', viewed_at) AS date,
  post_id,
  COUNT(*) AS views,
  COUNT(DISTINCT session_id) AS unique_visitors
FROM public.page_views
GROUP BY date_trunc('day', viewed_at), post_id;
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON public.daily_stats(date);

-- ─── RLS ─────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawled_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can do everything with posts" ON public.posts;
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Public can read tags" ON public.tags;
DROP POLICY IF EXISTS "Admins can manage tags" ON public.tags;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage crawl sources" ON public.crawl_sources;
DROP POLICY IF EXISTS "Admins can manage crawled items" ON public.crawled_items;
DROP POLICY IF EXISTS "Admins can manage ai logs" ON public.ai_generation_logs;
DROP POLICY IF EXISTS "Public can read settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage page views" ON public.page_views;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;

-- Helper function (RLS-safe admin check)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Posts policies
CREATE POLICY "Public can read published posts" ON public.posts
  FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can do everything with posts" ON public.posts
  FOR ALL USING (public.is_admin());

-- Categories policies
CREATE POLICY "Public can read categories" ON public.categories
  FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- Tags policies
CREATE POLICY "Public can read tags" ON public.tags
  FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Admins can manage tags" ON public.tags
  FOR ALL USING (public.is_admin());

-- Profiles policies
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (id = auth.uid() OR public.is_admin());

-- Crawl policies
CREATE POLICY "Admins can manage crawl sources" ON public.crawl_sources
  FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage crawled items" ON public.crawled_items
  FOR ALL USING (public.is_admin());

-- AI logs policy
CREATE POLICY "Admins can manage ai logs" ON public.ai_generation_logs
  FOR ALL USING (public.is_admin());

-- Settings policies
CREATE POLICY "Public can read settings" ON public.site_settings
  FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Admins can manage settings" ON public.site_settings
  FOR ALL USING (public.is_admin());

-- Page views policies
CREATE POLICY "Admins can manage page views" ON public.page_views
  FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can insert page views" ON public.page_views
  FOR INSERT TO PUBLIC WITH CHECK (true);

-- ─── Triggers ────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_updated_at ON public.posts;
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Auto-create profile on signup ───────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Storage ─────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Auth users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete images" ON storage.objects;

CREATE POLICY "Auth users can upload images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'images');
CREATE POLICY "Auth users can delete images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'images');

-- ─── Seed Data (skip if exists) ──────────────

INSERT INTO public.categories (name, slug, description, color) VALUES
  ('기술', 'tech', '최신 기술 트렌드와 리뷰', '#2563EB'),
  ('AI/ML', 'ai-ml', '인공지능과 머신러닝', '#7C3AED'),
  ('개발', 'dev', '프로그래밍과 개발 팁', '#059669'),
  ('라이프스타일', 'lifestyle', '일상과 라이프 해킹', '#D97706'),
  ('비즈니스', 'business', '비즈니스와 스타트업', '#DC2626'),
  ('생산성', 'productivity', '업무 효율과 생산성 도구', '#0891B2')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.tags (name, slug) VALUES
  ('ChatGPT', 'chatgpt'),
  ('AI', 'ai'),
  ('Python', 'python'),
  ('JavaScript', 'javascript'),
  ('React', 'react'),
  ('Next.js', 'nextjs'),
  ('노트북', 'notebook'),
  ('리뷰', 'review'),
  ('튜토리얼', 'tutorial'),
  ('트렌드', 'trend')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_settings (key, value, description) VALUES
  ('site_name', '"Blogwise"', '사이트 이름'),
  ('site_description', '"AI가 만드는 스마트 블로그"', '사이트 설명'),
  ('adsense_publisher_id', '""', 'Google AdSense 게시자 ID'),
  ('adsense_slots', '{}', '광고 슬롯 설정'),
  ('default_ai_provider', '"moonshot"', '기본 AI 프로바이더'),
  ('default_ai_model', '"moonshot-v1-128k"', '기본 AI 모델'),
  ('seo_defaults', '{"title_suffix": " | Blogwise", "og_type": "article"}', 'SEO 기본값'),
  ('crawl_rate_limit', '{"requests_per_minute": 10}', '크롤링 속도 제한')
ON CONFLICT (key) DO NOTHING;

-- ─── Increment view count RPC ────────────────

CREATE OR REPLACE FUNCTION public.increment_view_count(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE slug = post_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
