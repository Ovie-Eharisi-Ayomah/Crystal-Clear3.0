/*
  # Fix job relationships and queries

  1. Changes
    - Add unique constraint to profiles email
    - Add foreign key constraints with explicit names
    - Add indexes for common queries
    - Update RLS policies for better performance
*/

-- Add unique constraint to profiles email if not exists
DO $$ BEGIN
  ALTER TABLE profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add explicit foreign key constraints
ALTER TABLE job_requests
  DROP CONSTRAINT IF EXISTS job_requests_owner_id_fkey,
  DROP CONSTRAINT IF EXISTS job_requests_cleaner_id_fkey,
  DROP CONSTRAINT IF EXISTS job_requests_property_id_fkey;

ALTER TABLE job_requests
  ADD CONSTRAINT job_requests_owner_id_fkey 
    FOREIGN KEY (owner_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT job_requests_cleaner_id_fkey 
    FOREIGN KEY (cleaner_id) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL,
  ADD CONSTRAINT job_requests_property_id_fkey 
    FOREIGN KEY (property_id) 
    REFERENCES properties(id) 
    ON DELETE CASCADE;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_job_requests_owner_id ON job_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_cleaner_id ON job_requests(cleaner_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_property_id ON job_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_status ON job_requests(status);

-- Update RLS policies for better performance
DROP POLICY IF EXISTS "Users can view relevant job requests" ON job_requests;

CREATE POLICY "Users can view relevant job requests"
  ON job_requests FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
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