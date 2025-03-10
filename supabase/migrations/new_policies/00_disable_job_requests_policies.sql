-- Disable Job Requests Policies Script
-- This script disables RLS on job_requests to investigate the recursion issue

-- Disable RLS on job_requests table
ALTER TABLE job_requests DISABLE ROW LEVEL SECURITY;

-- Drop all existing job_requests policies to start fresh
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

-- Output confirmation
SELECT 'Job requests policies and RLS have been disabled' as message;