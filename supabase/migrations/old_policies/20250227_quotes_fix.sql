/*
  # Fix quotes deletion permission issue
  
  1. Changes
    - Add missing deletion policy for quotes
  
  2. Security
    - Allow cleaners to delete their own quotes
*/

-- Add missing policy for deleting quotes
CREATE POLICY "Cleaners can delete their own quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (cleaner_id = auth.uid());

-- Fix update policy if needed by explicitly recreating it
DROP POLICY IF EXISTS "Cleaners can update their own quotes" ON quotes;

CREATE POLICY "Cleaners can update their own quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (cleaner_id = auth.uid())
  WITH CHECK (cleaner_id = auth.uid());