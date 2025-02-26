/*
  # Add property deletion policies

  1. Changes
    - Add RLS policies to allow property owners to delete their properties
    - Add RLS policies to allow cascading deletion of property images
    - Add RLS policies to allow cascading deletion of job requests

  2. Security
    - Only property owners can delete their properties
    - Cascading deletion is handled through RLS policies
*/

-- Add policy for property owners to delete their properties
CREATE POLICY "Users can delete their own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Add policy for property owners to delete job requests for their properties
CREATE POLICY "Users can delete job requests for their properties"
  ON job_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = job_requests.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Add policy for property owners to delete property images
CREATE POLICY "Users can delete property images for their properties"
  ON property_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  );