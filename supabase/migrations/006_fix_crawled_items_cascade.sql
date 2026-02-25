-- Fix missing ON DELETE SET NULL on crawled_items.generated_post_id
-- This caused post deletion to fail when crawled items referenced the post

ALTER TABLE public.crawled_items
  DROP CONSTRAINT IF EXISTS crawled_items_generated_post_id_fkey;

ALTER TABLE public.crawled_items
  ADD CONSTRAINT crawled_items_generated_post_id_fkey
  FOREIGN KEY (generated_post_id) REFERENCES public.posts(id) ON DELETE SET NULL;
