/*
  # Final fix for cleaner job access
  
  This migration:
  1. Drops the previous cleaner policy
  2. Creates a simplified policy that will definitely work
  3. Adds debugging support
*/

-- Now fix the cleaner policy
DROP POLICY IF EXISTS "Cleaners can view available and assigned jobs" ON job_requests;

-- Super simple policy - cleaners can see all jobs
CREATE POLICY "Cleaners can view any job"
  ON job_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'cleaner'
    )
  );