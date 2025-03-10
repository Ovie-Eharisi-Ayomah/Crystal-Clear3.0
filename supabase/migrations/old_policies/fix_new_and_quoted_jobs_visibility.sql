-- Fix job visibility for cleaners to allow them to see both new and quoted jobs
-- This allows cleaners to still quote on jobs that have received quotes from other cleaners

-- Drop existing select policy
DROP POLICY IF EXISTS "fix_job_requests_select" ON job_requests;

-- Create updated policy that allows cleaners to see both new and quoted jobs
CREATE POLICY "fix_job_requests_select_with_quotes"
ON job_requests 
FOR SELECT 
USING (
  -- Homeowner can always see their own jobs
  owner_id = auth.uid() OR 
  (
    -- Cleaner can see jobs in these cases:
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'cleaner'
    ) AND 
    (
      -- Case 1: Job is new or quoted (hasn't been accepted yet)
      job_requests.status IN ('new', 'quoted') OR 
      
      -- Case 2: Cleaner is assigned to this job
      job_requests.cleaner_id = auth.uid() OR
      
      -- Case 3: Cleaner has quoted on this job
      EXISTS (
        SELECT 1 FROM quotes
        WHERE quotes.job_request_id = job_requests.id
        AND quotes.cleaner_id = auth.uid()
      )
    )
  )
);