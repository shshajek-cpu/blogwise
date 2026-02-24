-- Page Views
CREATE TABLE public.page_views (
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

CREATE INDEX idx_views_post ON public.page_views(post_id);
CREATE INDEX idx_views_date ON public.page_views(viewed_at);

-- Daily stats materialized view
CREATE MATERIALIZED VIEW public.daily_stats AS
SELECT
  date_trunc('day', viewed_at) AS date,
  post_id,
  COUNT(*) AS views,
  COUNT(DISTINCT session_id) AS unique_visitors
FROM public.page_views
GROUP BY date_trunc('day', viewed_at), post_id;

CREATE INDEX idx_daily_stats_date ON public.daily_stats(date);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage page views" ON public.page_views FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);
CREATE POLICY "Anyone can insert page views" ON public.page_views FOR INSERT TO PUBLIC WITH CHECK (true);
