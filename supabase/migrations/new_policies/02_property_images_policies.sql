-- Property Images Policies
-- This implements security policies for the property_images table

-- First, enable RLS on the property_images table
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "property_images_select_policy" ON property_images;
DROP POLICY IF EXISTS "property_images_select_for_cleaners" ON property_images;
DROP POLICY IF EXISTS "property_images_select_all" ON property_images;
DROP POLICY IF EXISTS "property_images_select_for_owners" ON property_images;
DROP POLICY IF EXISTS "property_images_insert" ON property_images;
DROP POLICY IF EXISTS "property_images_update" ON property_images;
DROP POLICY IF EXISTS "property_images_delete" ON property_images;

-- Create policy: Owners can see images for their own properties
CREATE POLICY "property_images_select_for_owners" 
ON property_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Create policy: Cleaners can see images for new/quoted jobs
CREATE POLICY "property_images_select_for_new_jobs" 
ON property_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM properties
    JOIN job_requests ON properties.id = job_requests.property_id
    WHERE property_images.property_id = properties.id
    AND job_requests.status IN ('new', 'quoted')
  )
);

-- Create policy: Cleaners can see images for jobs assigned to them
CREATE POLICY "property_images_select_for_assigned_jobs" 
ON property_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM properties
    JOIN job_requests ON properties.id = job_requests.property_id
    WHERE property_images.property_id = properties.id
    AND job_requests.cleaner_id = auth.uid()
  )
);

-- Create policy: Owners can only add images to their own properties
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

-- Create policy: Owners can only update images for their own properties
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

-- Create policy: Owners can only delete images for their own properties
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

-- Output confirmation
SELECT 'Property images policies created successfully' as message;