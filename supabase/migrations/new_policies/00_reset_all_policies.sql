-- COMPLETE RESET OF ALL POLICIES
-- This script removes all policies and temporarily disables RLS on all tables

-- Drop all existing policies for job_requests
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

-- Drop all existing policies for quotes
DROP POLICY IF EXISTS "quotes_select_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_insert_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_update_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_delete_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_update_by_owner_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_select_for_cleaners" ON quotes;
DROP POLICY IF EXISTS "quotes_select_own" ON quotes;
DROP POLICY IF EXISTS "quotes_select_for_homeowner" ON quotes;
DROP POLICY IF EXISTS "quotes_insert" ON quotes;
DROP POLICY IF EXISTS "quotes_update_by_cleaner" ON quotes;
DROP POLICY IF EXISTS "quotes_update_by_homeowner" ON quotes;
DROP POLICY IF EXISTS "quotes_delete" ON quotes;

-- Drop all existing policies for properties
DROP POLICY IF EXISTS "properties_select_for_cleaners" ON properties;
DROP POLICY IF EXISTS "properties_select_policy" ON properties;
DROP POLICY IF EXISTS "properties_select_own" ON properties;
DROP POLICY IF EXISTS "properties_select_for_new_quoted_jobs" ON properties;
DROP POLICY IF EXISTS "properties_select_for_assigned_jobs" ON properties;
DROP POLICY IF EXISTS "properties_select_all" ON properties;
DROP POLICY IF EXISTS "properties_insert_own" ON properties;
DROP POLICY IF EXISTS "properties_update_own" ON properties;
DROP POLICY IF EXISTS "properties_delete_own" ON properties;

-- Drop all existing policies for property_images
DROP POLICY IF EXISTS "property_images_select_policy" ON property_images;
DROP POLICY IF EXISTS "property_images_select_for_cleaners" ON property_images;
DROP POLICY IF EXISTS "property_images_select_all" ON property_images;
DROP POLICY IF EXISTS "property_images_insert" ON property_images;
DROP POLICY IF EXISTS "property_images_update" ON property_images;
DROP POLICY IF EXISTS "property_images_delete" ON property_images;

-- Drop profiles policies
DROP POLICY IF EXISTS "profiles_select_for_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_for_jobs" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;

-- Disable RLS on all tables
ALTER TABLE job_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop triggers
DROP TRIGGER IF EXISTS update_job_cleaner_id ON quotes;
DROP FUNCTION IF EXISTS set_cleaner_id_on_quote_accept();

-- Output confirmation
SELECT 'All policies and RLS have been reset' as message;