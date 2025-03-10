/*
  # Fix property access to ensure homeowners only see their own properties
  
  This migration:
  1. Drops the current overly permissive policy
  2. Adds proper restrictions for homeowners 
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view any property" ON properties;
DROP POLICY IF EXISTS "Users can manage their own properties" ON properties;

-- Create more restrictive policies

-- Owners can manage their own properties
CREATE POLICY "Owners can manage their own properties"
  ON properties FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Homeowners can only view their own properties
CREATE POLICY "Homeowners can view their own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_type = 'cleaner'
      ) AND
      EXISTS (
        SELECT 1 FROM job_requests
        WHERE job_requests.property_id = properties.id
        AND job_requests.status = 'new'
      )
    )
  );