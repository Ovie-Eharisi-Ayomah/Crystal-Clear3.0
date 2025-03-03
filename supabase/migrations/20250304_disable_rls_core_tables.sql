-- Emergency solution: disable RLS temporarily on core tables
-- This is a debugging measure to identify what's causing the recursion

-- Drop specific job_requests policies that might be causing recursion
DROP POLICY IF EXISTS job_requests_select_policy ON job_requests;
DROP POLICY IF EXISTS job_requests_insert_policy ON job_requests;
DROP POLICY IF EXISTS job_requests_update_policy ON job_requests;
DROP POLICY IF EXISTS job_requests_delete_policy ON job_requests;
DROP POLICY IF EXISTS "Homeowners can manage their own job requests" ON job_requests;
DROP POLICY IF EXISTS "Cleaners can view available and assigned jobs" ON job_requests;
DROP POLICY IF EXISTS "homeowners_view_own_requests" ON job_requests;
DROP POLICY IF EXISTS "cleaner_view_jobs" ON job_requests;
DROP POLICY IF EXISTS "homeowners_insert_requests" ON job_requests;
DROP POLICY IF EXISTS "homeowners_update_requests" ON job_requests;
DROP POLICY IF EXISTS "homeowners_delete_requests" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_select" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_insert" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_update" ON job_requests;
DROP POLICY IF EXISTS "fix_job_requests_delete" ON job_requests;
DROP POLICY IF EXISTS "homeowner_view_own_requests" ON job_requests;
DROP POLICY IF EXISTS "cleaner_view_jobs" ON job_requests;
DROP POLICY IF EXISTS "homeowner_insert_policy" ON job_requests;
DROP POLICY IF EXISTS "homeowner_update_policy" ON job_requests;
DROP POLICY IF EXISTS "homeowner_delete_policy" ON job_requests;

-- Disable RLS on core tables
ALTER TABLE job_requests DISABLE ROW LEVEL SECURITY;

-- Log the action for audit
SELECT now() as timestamp, 'RLS disabled for debugging' as action;