/*
  # Fix cleaner access to property and owner data
  
  1. Changes
    - Add RLS policies to allow cleaners to view property data for jobs with 'new' status
    - Add RLS policies to allow cleaners to view owner profiles for jobs with 'new' status
  
  2. Security
    - Maintain appropriate access control
    - Only expose necessary data for quoting
*/

-- Allow cleaners to view property details for jobs they can access
CREATE POLICY "Cleaners can view properties for available jobs"
  ON properties FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT property_id FROM job_requests
      WHERE status = 'new' AND 
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_type = 'cleaner'
      )
    ) OR owner_id = auth.uid()
  );

-- Allow cleaners to view owner profiles for jobs they can access
CREATE POLICY "Cleaners can view property owners for available jobs"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT owner_id FROM job_requests
      WHERE status = 'new' AND 
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_type = 'cleaner'
      )
    ) OR id = auth.uid()
  );

-- Allow cleaners to view property images for jobs they can access
CREATE POLICY "Cleaners can view property images for available jobs"
  ON property_images FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT property_id FROM job_requests
      WHERE status = 'new' AND 
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.user_type = 'cleaner'
      )
    ) OR 
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  );