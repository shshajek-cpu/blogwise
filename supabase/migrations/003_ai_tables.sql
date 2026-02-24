-- AI Generation Logs
CREATE TABLE public.ai_generation_logs (
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

ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage ai logs" ON public.ai_generation_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
);

-- Site Settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read settings" ON public.site_settings FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed default settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('site_name', '"Blogwise"', '사이트 이름'),
  ('site_description', '"AI가 만드는 스마트 블로그"', '사이트 설명'),
  ('adsense_publisher_id', '""', 'Google AdSense 게시자 ID'),
  ('adsense_slots', '{}', '광고 슬롯 설정'),
  ('default_ai_provider', '"openai"', '기본 AI 프로바이더'),
  ('default_ai_model', '"gpt-4o"', '기본 AI 모델'),
  ('seo_defaults', '{"title_suffix": " | Blogwise", "og_type": "article"}', 'SEO 기본값'),
  ('crawl_rate_limit', '{"requests_per_minute": 10}', '크롤링 속도 제한');
