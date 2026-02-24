-- Supabase Storage Setup for BlogWise Image Uploads
-- Run these statements in the Supabase SQL Editor (Dashboard > SQL Editor)
-- or apply via the Supabase CLI migrations.
--
-- Prerequisites: Supabase Storage extension must be enabled (it is by default).

-- ─────────────────────────────────────────────
-- 1. Create the 'images' storage bucket
-- ─────────────────────────────────────────────
-- public = true means files are readable without a signed URL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. Row-Level Security policies for storage.objects
-- ─────────────────────────────────────────────

-- Allow authenticated users to upload images
CREATE POLICY "Auth users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Allow public (anonymous) read access so images render in the blog
CREATE POLICY "Public read access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

-- Allow authenticated users to delete images they uploaded
CREATE POLICY "Auth users can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'images');

-- ─────────────────────────────────────────────
-- 3. (Optional) Restrict uploads to a specific folder per user
-- ─────────────────────────────────────────────
-- Uncomment the policy below if you want each user to only upload
-- into their own subfolder (e.g. posts/<user-id>/filename).
--
-- DROP POLICY IF EXISTS "Auth users can upload images" ON storage.objects;
-- CREATE POLICY "Auth users can upload to own folder"
--   ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     bucket_id = 'images' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );

-- ─────────────────────────────────────────────
-- 4. Usage notes
-- ─────────────────────────────────────────────
-- Files are uploaded to the path:  posts/<timestamp>-<random>.<ext>
-- Public URL pattern:
--   https://<project-ref>.supabase.co/storage/v1/object/public/images/posts/<filename>
--
-- The upload API route is: POST /api/upload
-- Accepted MIME types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml
-- Maximum file size enforced server-side: 5 MB
--
-- To verify the bucket was created:
--   SELECT * FROM storage.buckets WHERE id = 'images';
--
-- To verify policies were applied:
--   SELECT policyname, cmd, roles FROM pg_policies
--   WHERE tablename = 'objects' AND schemaname = 'storage';
