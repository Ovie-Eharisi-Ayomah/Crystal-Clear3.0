/*
  # Fix job request queries and policies

  1. Changes
    - Add missing RLS policies for job requests
    - Add explicit foreign key references
    - Add indexes for performance
    - Update existing policies for better clarity

  2. Security
    - Ensure proper access control for job requests
    - Add policies for viewing and managing job requests
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view relevant job requests" ON job_requests;

-- Create more specific policies for job requests
CREATE POLICY "Homeowners can view their own job requests"
  ON job_requests FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Cleaners can view assigned jobs"
  ON job_requests FOR SELECT
  TO authenticated
  USING (
    cleaner_id = auth.uid() OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND user_type = 'cleaner'
      ) AND
      status = 'new'
    )
  );

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_job_requests_status_owner
  ON job_requests(status, owner_id);

CREATE INDEX IF NOT EXISTS idx_job_requests_status_cleaner
  ON job_requests(status, cleaner_id);

-- Add composite indexes for common joins
CREATE INDEX IF NOT EXISTS idx_job_requests_property_owner
  ON job_requests(property_id, owner_id);

-- Update or add foreign key constraints with explicit names
ALTER TABLE job_requests
  DROP CONSTRAINT IF EXISTS job_requests_owner_id_fkey,
  ADD CONSTRAINT job_requests_owner_id_fkey 
    FOREIGN KEY (owner_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

ALTER TABLE job_requests
  DROP CONSTRAINT IF EXISTS job_requests_cleaner_id_fkey,
  ADD CONSTRAINT job_requests_cleaner_id_fkey 
    FOREIGN KEY (cleaner_id) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL;

ALTER TABLE job_requests
  DROP CONSTRAINT IF EXISTS job_requests_property_id_fkey,
  ADD CONSTRAINT job_requests_property_id_fkey 
    FOREIGN KEY (property_id) 
    REFERENCES properties(id) 
    ON DELETE CASCADE;