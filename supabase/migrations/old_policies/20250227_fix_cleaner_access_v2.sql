/*
  # Fix infinite recursion in RLS policies
  
  1. Changes
    - Drop problematic policies that cause infinite recursion
    - Replace with simpler, non-recursive policies
  
  2. Security
    - Maintain appropriate access control
    - Fix circular references in policies
*/

-- First drop the problematic policies
DROP POLICY IF EXISTS "Cleaners can view property owners for available jobs" ON profiles;
DROP POLICY IF EXISTS "Cleaners can view properties for available jobs" ON properties;
DROP POLICY IF EXISTS "Cleaners can view property images for available jobs" ON property_images;

-- Simplified policy for profiles - avoid circular references
CREATE POLICY "Users can view profiles needed for job requests"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own profile
    id = auth.uid() OR
    -- Or profiles related to job requests with 'new' status (for cleaners)
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'cleaner'
    ) AND
    EXISTS (
      SELECT 1 FROM job_requests
      WHERE job_requests.owner_id = profiles.id
      AND job_requests.status = 'new'
    ))
  );

-- Simplified policy for properties
CREATE POLICY "Users can view properties for job requests"
  ON properties FOR SELECT
  TO authenticated
  USING (
    -- Users can see their own properties
    owner_id = auth.uid() OR
    -- Or properties with job requests that have 'new' status (for cleaners)
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'cleaner'
    ) AND
    EXISTS (
      SELECT 1 FROM job_requests
      WHERE job_requests.property_id = properties.id
      AND job_requests.status = 'new'
    ))
  );

-- Simplified policy for property images
CREATE POLICY "Users can view property images for job requests"
  ON property_images FOR SELECT
  TO authenticated
  USING (
    -- Users can see images of their own properties
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    ) OR
    -- Or images of properties with job requests that have 'new' status (for cleaners)
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'cleaner'
    ) AND
    EXISTS (
      SELECT 1 FROM job_requests
      WHERE job_requests.status = 'new'
      AND EXISTS (
        SELECT 1 FROM properties
        WHERE properties.id = job_requests.property_id
        AND properties.id = property_images.property_id
      )
    ))
  );