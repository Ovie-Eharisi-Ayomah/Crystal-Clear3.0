/*
  # Storage bucket and policies setup

  1. Changes
    - Create storage bucket for property images
    - Set up basic storage policies
    - Enable authenticated access

  2. Security
    - Enable RLS for storage
    - Add policies for authenticated users
    - Secure file management
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "property_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "property_images_delete_policy" ON storage.objects;

-- Create policy to allow authenticated users to upload images
CREATE POLICY "property_images_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to read images
CREATE POLICY "property_images_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
);

-- Create policy to allow users to delete their own images
CREATE POLICY "property_images_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);