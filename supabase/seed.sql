-- Seed categories
INSERT INTO public.categories (name, slug, description, color) VALUES
  ('기술', 'tech', '최신 기술 트렌드와 리뷰', '#2563EB'),
  ('AI/ML', 'ai-ml', '인공지능과 머신러닝', '#7C3AED'),
  ('개발', 'dev', '프로그래밍과 개발 팁', '#059669'),
  ('라이프스타일', 'lifestyle', '일상과 라이프 해킹', '#D97706'),
  ('비즈니스', 'business', '비즈니스와 스타트업', '#DC2626'),
  ('생산성', 'productivity', '업무 효율과 생산성 도구', '#0891B2');

-- Seed tags
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
  ('트렌드', 'trend');
