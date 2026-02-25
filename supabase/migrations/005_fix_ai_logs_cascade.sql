-- Fix missing ON DELETE CASCADE on ai_generation_logs.post_id
-- This caused post deletion to fail when AI generation logs existed

ALTER TABLE public.ai_generation_logs
  DROP CONSTRAINT IF EXISTS ai_generation_logs_post_id_fkey;

ALTER TABLE public.ai_generation_logs
  ADD CONSTRAINT ai_generation_logs_post_id_fkey
  FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
