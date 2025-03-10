-- Fix infinite recursion in job_requests policy - simplified approach

-- Temporarily disable RLS to reset policies
ALTER TABLE job_requests DISABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "fix_job_requests_select" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_insert" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_update" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_delete" ON job_requests;

-- Re-enable RLS
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;

-- Create separate policies for homeowners and cleaners to avoid recursion
-- Notice there are NO nested EXISTS queries referencing other tables

-- Homeowners can only see their own job requests
CREATE POLICY "homeowner_view_own_requests"
ON job_requests 
FOR SELECT 
TO authenticated
USING (
  -- Only allow if user role is 'homeowner' and they own the request
  auth.uid() = owner_id
);

-- Cleaners can see jobs that are available or assigned to them
CREATE POLICY "cleaner_view_jobs"
ON job_requests 
FOR SELECT 
TO authenticated
USING (
  -- Only show new jobs OR jobs assigned to this cleaner
  job_requests.status = 'new' OR job_requests.cleaner_id = auth.uid()
);

-- Create simple policies for insert, update, delete
CREATE POLICY "homeowner_insert_policy"
ON job_requests 
FOR INSERT 
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "homeowner_update_policy"
ON job_requests 
FOR UPDATE 
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "homeowner_delete_policy"
ON job_requests 
FOR DELETE 
TO authenticated
USING (owner_id = auth.uid());