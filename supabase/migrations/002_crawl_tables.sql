-- Crawl Sources
CREATE TABLE public.crawl_sources (
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

ALTER TABLE public.crawl_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage crawl sources" ON public.crawl_sources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Crawled Items
CREATE TABLE public.crawled_items (
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

CREATE INDEX idx_crawled_source ON public.crawled_items(source_id);
CREATE INDEX idx_crawled_url ON public.crawled_items(original_url);
CREATE INDEX idx_crawled_unused ON public.crawled_items(is_used) WHERE is_used = false;

ALTER TABLE public.crawled_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage crawled items" ON public.crawled_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
