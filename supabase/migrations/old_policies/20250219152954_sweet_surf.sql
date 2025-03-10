/*
  # Storage bucket configuration update

  1. Changes
    - Update storage bucket configuration with size limits and mime types
    - Add additional security policies for image management
    - Enable secure image uploads for authenticated users

  2. Security
    - Set file size limit to 10MB
    - Restrict allowed mime types to images
    - Add policies for updating and managing images
*/

-- Update bucket configuration with size and type restrictions
UPDATE storage.buckets
SET 
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif']::text[]
WHERE id = 'property-images';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "property_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_public_select_policy" ON storage.objects;

-- Create policy for updating own images
CREATE POLICY "property_images_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'property-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for public viewing of images
CREATE POLICY "property_images_public_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');