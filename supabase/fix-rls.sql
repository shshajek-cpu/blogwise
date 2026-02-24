-- =============================================
-- BlogWise RLS 무한 재귀 수정
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. SECURITY DEFINER 함수 생성 (RLS 우회하여 admin 체크)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT auth.uid() = user_id
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. profiles 테이블 정책 수정
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (
    id = auth.uid() OR public.is_admin()
  );

-- 3. posts 정책 수정
DROP POLICY IF EXISTS "Admins can do everything with posts" ON public.posts;
CREATE POLICY "Admins can do everything with posts" ON public.posts
  FOR ALL USING (public.is_admin());

-- 4. categories 정책 수정
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- 5. tags 정책 수정
DROP POLICY IF EXISTS "Admins can manage tags" ON public.tags;
CREATE POLICY "Admins can manage tags" ON public.tags
  FOR ALL USING (public.is_admin());

-- 6. crawl_sources 정책 수정
DROP POLICY IF EXISTS "Admins can manage crawl sources" ON public.crawl_sources;
CREATE POLICY "Admins can manage crawl sources" ON public.crawl_sources
  FOR ALL USING (public.is_admin());

-- 7. crawled_items 정책 수정
DROP POLICY IF EXISTS "Admins can manage crawled items" ON public.crawled_items;
CREATE POLICY "Admins can manage crawled items" ON public.crawled_items
  FOR ALL USING (public.is_admin());

-- 8. ai_generation_logs 정책 수정
DROP POLICY IF EXISTS "Admins can manage ai logs" ON public.ai_generation_logs;
CREATE POLICY "Admins can manage ai logs" ON public.ai_generation_logs
  FOR ALL USING (public.is_admin());

-- 9. site_settings 정책 수정
DROP POLICY IF EXISTS "Admins can manage settings" ON public.site_settings;
CREATE POLICY "Admins can manage settings" ON public.site_settings
  FOR ALL USING (public.is_admin());

-- 10. page_views 정책 수정
DROP POLICY IF EXISTS "Admins can manage page views" ON public.page_views;
CREATE POLICY "Admins can manage page views" ON public.page_views
  FOR ALL USING (public.is_admin());
