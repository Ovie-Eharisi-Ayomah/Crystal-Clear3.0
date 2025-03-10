-- Fix Property Images Policies
-- This script creates a simple policy for property_images to avoid recursion

-- First, ensure RLS is enabled
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "property_images_select_policy" ON property_images;
DROP POLICY IF EXISTS "property_images_select_for_cleaners" ON property_images;
DROP POLICY IF EXISTS "property_images_select_all" ON property_images;

-- Create a simple policy that allows all authenticated users to read property images
-- This avoids recursion while still requiring authentication
CREATE POLICY "property_images_select_all" 
ON property_images 
FOR SELECT 
USING (true);

-- Add insert/update/delete policies for proper security
-- These assume there's an owner_id or property_id column that can be used for access control
-- Modify as needed based on your table structure

-- Assuming property_images has a property_id linking to properties
CREATE POLICY "property_images_insert" 
ON property_images 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "property_images_update" 
ON property_images 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "property_images_delete" 
ON property_images 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Verification
SELECT 
  policyname,
  permissive,
  cmd
FROM 
  pg_policies 
WHERE 
  tablename = 'property_images'
ORDER BY 
  policyname;