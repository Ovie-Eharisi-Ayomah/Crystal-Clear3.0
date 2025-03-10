-- Job Requests Policies
-- This implements security policies for the job_requests table

-- First, enable RLS on the job_requests table
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "job_requests_select_policy" ON job_requests;
DROP POLICY IF EXISTS "job_requests_insert_policy" ON job_requests;
DROP POLICY IF EXISTS "job_requests_update_policy" ON job_requests;
DROP POLICY IF EXISTS "job_requests_delete_policy" ON job_requests;
DROP POLICY IF EXISTS "Homeowners can manage their own job requests" ON job_requests;
DROP POLICY IF EXISTS "Cleaners can view available and assigned jobs" ON job_requests;
DROP POLICY IF EXISTS "homeowners_view_own_requests" ON job_requests;
DROP POLICY IF EXISTS "cleaner_view_jobs" ON job_requests;
DROP POLICY IF EXISTS "homeowners_insert_requests" ON job_requests;
DROP POLICY IF EXISTS "homeowners_update_requests" ON job_requests;
DROP POLICY IF EXISTS "homeowners_delete_requests" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_select" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_select_with_quotes" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_insert" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_update" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_delete" ON job_requests;
DROP POLICY IF EXISTS "homeowner_view_own_requests" ON job_requests;
DROP POLICY IF EXISTS "cleaner_view_jobs" ON job_requests;
DROP POLICY IF EXISTS "homeowner_insert_policy" ON job_requests;
DROP POLICY IF EXISTS "homeowner_update_policy" ON job_requests;
DROP POLICY IF EXISTS "homeowner_delete_policy" ON job_requests;
DROP POLICY IF EXISTS "job_requests_select_for_homeowners" ON job_requests;
DROP POLICY IF EXISTS "job_requests_select_public_for_cleaners" ON job_requests;
DROP POLICY IF EXISTS "job_requests_select_assigned_for_cleaners" ON job_requests;
DROP POLICY IF EXISTS "job_requests_select_new_quoted" ON job_requests;
DROP POLICY IF EXISTS "job_requests_select_assigned" ON job_requests;
DROP POLICY IF EXISTS "job_requests_insert" ON job_requests;
DROP POLICY IF EXISTS "job_requests_update_by_homeowner" ON job_requests;
DROP POLICY IF EXISTS "job_requests_update_by_cleaner" ON job_requests;
DROP POLICY IF EXISTS "job_requests_delete" ON job_requests;

-- Now create the new policies - split into multiple simple policies to avoid recursion

-- Policy 1: Owners can see their own job requests
CREATE POLICY "job_requests_select_for_homeowners" 
ON job_requests 
FOR SELECT 
USING (owner_id = auth.uid());

-- Policy 2: Cleaners can see all new/quoted jobs
CREATE POLICY "job_requests_select_new_quoted" 
ON job_requests 
FOR SELECT 
USING (
  status IN ('new', 'quoted')
);

-- Policy 3: Cleaners can see jobs assigned to them
CREATE POLICY "job_requests_select_assigned" 
ON job_requests 
FOR SELECT 
USING (cleaner_id = auth.uid());

-- Policy 4: Owners can create job requests
CREATE POLICY "job_requests_insert" 
ON job_requests 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

-- Policy 5: Owners can update their own job requests
CREATE POLICY "job_requests_update_by_homeowner" 
ON job_requests 
FOR UPDATE 
USING (owner_id = auth.uid());

-- Policy 6: Cleaners can update jobs assigned to them
CREATE POLICY "job_requests_update_by_cleaner" 
ON job_requests 
FOR UPDATE 
USING (cleaner_id = auth.uid());

-- Policy 7: Owners can delete their own new job requests
CREATE POLICY "job_requests_delete" 
ON job_requests 
FOR DELETE 
USING (
  owner_id = auth.uid() AND 
  status = 'new'
);

-- Output confirmation
SELECT 'Job requests policies created successfully' as message;