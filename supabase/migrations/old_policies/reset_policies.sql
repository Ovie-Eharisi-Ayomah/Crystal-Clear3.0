-- Reset Database Policies Script
-- This script will restore the database to its previous state

-- Step 1: Re-enable RLS on tables
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop triggers created in this session
DROP TRIGGER IF EXISTS update_job_cleaner_id ON quotes;
DROP FUNCTION IF EXISTS set_cleaner_id_on_quote_accept();

-- Step 3: Drop all policies created or modified in this session
-- For job_requests
DROP POLICY IF EXISTS "job_requests_select_for_homeowners" ON job_requests;
DROP POLICY IF EXISTS "job_requests_select_public_for_cleaners" ON job_requests;
DROP POLICY IF EXISTS "job_requests_select_assigned_for_cleaners" ON job_requests;
DROP POLICY IF EXISTS "job_requests_insert_policy" ON job_requests;
DROP POLICY IF EXISTS "job_requests_update_policy" ON job_requests;
DROP POLICY IF EXISTS "job_requests_delete_policy" ON job_requests;

-- For profiles
DROP POLICY IF EXISTS "profiles_select_for_all" ON profiles;

-- For quotes
DROP POLICY IF EXISTS "quotes_select_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_select_for_cleaners" ON quotes;
DROP POLICY IF EXISTS "quotes_select_own" ON quotes;
DROP POLICY IF EXISTS "quotes_insert_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_update_policy" ON quotes;
DROP POLICY IF EXISTS "quotes_delete_policy" ON quotes;

-- For properties
DROP POLICY IF EXISTS "properties_select_for_cleaners" ON properties;

-- Step 4: Restore original policies

-- Recreate the original job visibility policy
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
      job_requests.cleaner_id = auth.uid()
    )
  )
);

-- Now we need to reset the original profiles policy
CREATE POLICY "profiles_select_for_jobs" 
ON profiles 
FOR SELECT 
USING (
  -- Allow users to see their own profile
  profiles.id = auth.uid() OR
  
  -- Allow homeowners to see cleaner profiles who have quoted on their jobs
  (
    EXISTS (
      SELECT 1 FROM profiles owner_profile
      WHERE owner_profile.id = auth.uid()
      AND owner_profile.user_type = 'homeowner'
    ) AND
    EXISTS (
      SELECT 1 FROM quotes q
      JOIN job_requests jr ON q.job_request_id = jr.id
      WHERE q.cleaner_id = profiles.id
      AND jr.owner_id = auth.uid()
    )
  ) OR
  
  -- Allow cleaners to see homeowner profiles for jobs they can access
  (
    EXISTS (
      SELECT 1 FROM profiles cleaner_profile
      WHERE cleaner_profile.id = auth.uid()
      AND cleaner_profile.user_type = 'cleaner'
    ) AND
    EXISTS (
      SELECT 1 FROM job_requests
      WHERE job_requests.owner_id = profiles.id
      AND (
        -- All cleaners can see homeowner profiles for new or quoted jobs
        job_requests.status IN ('new', 'quoted') OR
        -- For accepted or other status jobs, check if this cleaner has quoted
        EXISTS (
          SELECT 1 FROM quotes
          WHERE quotes.job_request_id = job_requests.id
          AND quotes.cleaner_id = auth.uid()
        )
      )
    )
  )
);

-- Restore properties policy
CREATE POLICY "properties_select_for_cleaners" 
ON properties 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM job_requests
    WHERE job_requests.property_id = properties.id
    AND (
      -- All cleaners can see properties for new or quoted jobs
      job_requests.status IN ('new', 'quoted') OR
      -- For accepted or other status jobs, check if this cleaner has an accepted quote
      EXISTS (
        SELECT 1 FROM quotes
        WHERE quotes.job_request_id = job_requests.id
        AND quotes.cleaner_id = auth.uid()
      )
    )
  )
);

-- Create basic quotes policies
CREATE POLICY "quotes_select_policy" 
ON quotes 
FOR SELECT 
USING (
  -- Homeowners can see quotes for their own jobs
  EXISTS (
    SELECT 1 FROM job_requests
    WHERE job_requests.id = quotes.job_request_id
    AND job_requests.owner_id = auth.uid()
  ) OR
  
  -- Cleaners can see their own quotes
  quotes.cleaner_id = auth.uid()
);

CREATE POLICY "quotes_insert_policy" 
ON quotes 
FOR INSERT 
WITH CHECK (
  -- User must be a cleaner
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'cleaner'
  ) AND
  
  -- The quote's cleaner_id must match the user's ID
  quotes.cleaner_id = auth.uid()
);

-- Output confirmation message
SELECT 'Database policies have been reset to their original state' as message;