-- Rebuild Database Policies Script
-- This script rebuilds policies for job_requests, quotes, and properties from scratch
-- with a focus on avoiding recursion issues

-------------------------------------------------------------------------------
-- STEP 1: DROP ALL EXISTING POLICIES
-------------------------------------------------------------------------------

-- Drop job_requests policies
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

-- Drop quotes policies
DROP POLICY IF EXISTS "quotes_select_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_insert_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_update_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_delete_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_update_by_owner_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_select_for_cleaners" ON quotes;
DROP POLICY IF EXISTS "quotes_select_own" ON quotes;

-- Drop properties policies
DROP POLICY IF EXISTS "properties_select_for_cleaners" ON properties;
DROP POLICY IF EXISTS "properties_select_policy" ON properties;

-- Drop profiles policies
DROP POLICY IF EXISTS "profiles_select_for_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_for_jobs" ON profiles;

-------------------------------------------------------------------------------
-- STEP 2: RE-ENABLE ROW LEVEL SECURITY
-------------------------------------------------------------------------------

ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- STEP 3: CREATE DATABASE TRIGGER FOR QUOTE ACCEPTANCE
-------------------------------------------------------------------------------

-- Create a trigger to automatically update job_requests.cleaner_id when a quote is accepted
CREATE OR REPLACE FUNCTION set_cleaner_id_on_quote_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- When a quote's status changes to 'accepted'
  IF NEW.status = 'accepted' THEN
    -- Update the job_request's cleaner_id with the quote's cleaner_id
    UPDATE job_requests 
    SET cleaner_id = NEW.cleaner_id
    WHERE id = NEW.job_request_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_job_cleaner_id ON quotes;

-- Create the trigger on the quotes table
CREATE TRIGGER update_job_cleaner_id
AFTER UPDATE OF status ON quotes
FOR EACH ROW
WHEN (NEW.status = 'accepted')
EXECUTE FUNCTION set_cleaner_id_on_quote_accept();

-------------------------------------------------------------------------------
-- STEP 4: CREATE NEW NON-RECURSIVE POLICIES
-------------------------------------------------------------------------------

-- JOB_REQUESTS POLICIES - Split into separate policies to avoid recursion

-- Policy 1: Homeowners can see their own jobs
CREATE POLICY "job_requests_select_for_homeowners" 
ON job_requests 
FOR SELECT 
USING (owner_id = auth.uid());

-- Policy 2: Cleaners can see all new or quoted jobs (no joins)
CREATE POLICY "job_requests_select_new_quoted" 
ON job_requests 
FOR SELECT 
USING (
  -- Simple condition without joins to avoid recursion
  status IN ('new', 'quoted')
);

-- Policy 3: Cleaners can see jobs assigned to them
CREATE POLICY "job_requests_select_assigned" 
ON job_requests 
FOR SELECT 
USING (cleaner_id = auth.uid());

-- Policy 4: Only homeowners can create job requests
CREATE POLICY "job_requests_insert" 
ON job_requests 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

-- Policy 5: Homeowners can update their own job requests
CREATE POLICY "job_requests_update_by_homeowner" 
ON job_requests 
FOR UPDATE
USING (owner_id = auth.uid());

-- Policy 6: Cleaners can update jobs assigned to them
CREATE POLICY "job_requests_update_by_cleaner" 
ON job_requests 
FOR UPDATE
USING (cleaner_id = auth.uid());

-- Policy 7: Only homeowners can delete their own new job requests
CREATE POLICY "job_requests_delete" 
ON job_requests 
FOR DELETE
USING (
  owner_id = auth.uid() AND
  status = 'new'
);

-- QUOTES POLICIES - Split into separate, simple policies

-- Policy 1: Cleaners can see their own quotes
CREATE POLICY "quotes_select_own" 
ON quotes 
FOR SELECT 
USING (cleaner_id = auth.uid());

-- Policy 2: Homeowners can see quotes for their jobs
CREATE POLICY "quotes_select_for_homeowner" 
ON quotes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM job_requests
    WHERE job_requests.id = quotes.job_request_id
    AND job_requests.owner_id = auth.uid()
  )
);

-- Policy 3: Cleaners can create quotes (with their own cleaner_id)
CREATE POLICY "quotes_insert" 
ON quotes 
FOR INSERT 
WITH CHECK (cleaner_id = auth.uid());

-- Policy 4: Cleaners can update their own quotes
CREATE POLICY "quotes_update_by_cleaner" 
ON quotes 
FOR UPDATE 
USING (cleaner_id = auth.uid());

-- Policy 5: Homeowners can update quotes for their jobs (e.g., to accept them)
CREATE POLICY "quotes_update_by_homeowner" 
ON quotes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM job_requests
    WHERE job_requests.id = quotes.job_request_id
    AND job_requests.owner_id = auth.uid()
  )
);

-- Policy 6: Cleaners can delete their own quotes
CREATE POLICY "quotes_delete" 
ON quotes 
FOR DELETE 
USING (cleaner_id = auth.uid());

-- PROPERTIES POLICIES

-- Policy 1: Homeowners can see their own properties
CREATE POLICY "properties_select_own" 
ON properties 
FOR SELECT 
USING (
  owner_id = auth.uid()
);

-- Policy 2: Cleaners can see properties for new or quoted jobs
CREATE POLICY "properties_select_for_new_quoted_jobs" 
ON properties 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM job_requests
    WHERE job_requests.property_id = properties.id
    AND job_requests.status IN ('new', 'quoted')
  )
);

-- Policy 3: Cleaners can see properties for jobs assigned to them
CREATE POLICY "properties_select_for_assigned_jobs" 
ON properties 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM job_requests
    WHERE job_requests.property_id = properties.id
    AND job_requests.cleaner_id = auth.uid()
  )
);

-- PROFILES POLICIES

-- Allow all authenticated users to see profiles
-- This is simpler and avoids recursion issues
CREATE POLICY "profiles_select_all" 
ON profiles 
FOR SELECT 
USING (true);

-------------------------------------------------------------------------------
-- STEP 5: CLEANUP AND VERIFICATION
-------------------------------------------------------------------------------

-- Check if the policies were created successfully
SELECT 
  tablename, 
  policyname 
FROM 
  pg_policies 
WHERE 
  tablename IN ('job_requests', 'quotes', 'properties', 'profiles')
ORDER BY 
  tablename, 
  policyname;