-- Quotes Policies
-- This implements security policies for the quotes table

-- First, enable RLS on the quotes table
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
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

-- Now create the new policies - split into multiple simple policies to avoid recursion

-- Policy 1: Cleaners can see their own quotes
CREATE POLICY "quotes_select_own" 
ON quotes 
FOR SELECT 
USING (cleaner_id = auth.uid());

-- Policy 2: Owners can see quotes for their job requests
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

-- Policy 3: Cleaners can submit quotes
CREATE POLICY "quotes_insert" 
ON quotes 
FOR INSERT 
WITH CHECK (cleaner_id = auth.uid());

-- Policy 4: Cleaners can update their own quotes
CREATE POLICY "quotes_update_by_cleaner" 
ON quotes 
FOR UPDATE 
USING (
  cleaner_id = auth.uid() AND
  status = 'pending'
);

-- Policy 5: Owners can update quotes for their jobs (e.g., accept)
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
USING (
  cleaner_id = auth.uid() AND
  status = 'pending'
);

-- Output confirmation
SELECT 'Quotes policies created successfully' as message;