-- Fix infinite recursion in job_requests policy - simpler approach

-- Drop all existing policies for job_requests
DROP POLICY IF EXISTS job_requests_select_policy ON job_requests;
DROP POLICY IF EXISTS job_requests_insert_policy ON job_requests;
DROP POLICY IF EXISTS job_requests_update_policy ON job_requests;
DROP POLICY IF EXISTS job_requests_delete_policy ON job_requests;
DROP POLICY IF EXISTS "Homeowners can manage their own job requests" ON job_requests;
DROP POLICY IF EXISTS "Cleaners can view available and assigned jobs" ON job_requests;
DROP POLICY IF EXISTS "homeowners_view_own_requests" ON job_requests;
DROP POLICY IF EXISTS "cleaners_view_jobs" ON job_requests;
DROP POLICY IF EXISTS "homeowners_insert_requests" ON job_requests;
DROP POLICY IF EXISTS "homeowners_update_requests" ON job_requests;
DROP POLICY IF EXISTS "homeowners_delete_requests" ON job_requests;

-- Create a very simple policy for select - no recursion, just direct checks
CREATE POLICY "fix_job_requests_select"
ON job_requests 
FOR SELECT 
USING (
  -- Simple check: user is either the owner or a cleaner who can see this job
  owner_id = auth.uid() OR 
  (
    -- Cleaner can see jobs that are new or assigned to them
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'cleaner'
    ) AND 
    (job_requests.status = 'new' OR job_requests.cleaner_id = auth.uid())
  )
);

-- Simple insert policy for homeowners
CREATE POLICY "fix_job_requests_insert"
ON job_requests 
FOR INSERT 
WITH CHECK (
  owner_id = auth.uid()
);

-- Simple update policy for homeowners
CREATE POLICY "fix_job_requests_update"
ON job_requests 
FOR UPDATE 
USING (
  owner_id = auth.uid()
)
WITH CHECK (
  owner_id = auth.uid() 
);

-- Simple delete policy for homeowners
CREATE POLICY "fix_job_requests_delete"
ON job_requests 
FOR DELETE 
USING (
  owner_id = auth.uid()
);