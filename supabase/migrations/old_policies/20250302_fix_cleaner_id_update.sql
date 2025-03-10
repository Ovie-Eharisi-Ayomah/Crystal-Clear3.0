-- This migration adds explicit permissions to allow updating the cleaner_id field
-- Check if RLS is already enabled
DO $$
BEGIN
    RAISE NOTICE 'Checking RLS status on job_requests table...';
END $$;

-- Drop existing policies (if they exist) to start fresh
DROP POLICY IF EXISTS job_requests_update_policy ON job_requests;
DROP POLICY IF EXISTS quotes_update_policy ON quotes;
DROP POLICY IF EXISTS quotes_update_by_owner_policy ON quotes;

-- Make sure job_requests table can be modified by homeowners
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;

-- Create direct RLS policy for homeowners updating their job_requests
CREATE POLICY job_requests_update_policy 
ON job_requests 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Allow homeowners to update quotes on their job requests
CREATE POLICY quotes_update_by_owner_policy
ON quotes
FOR UPDATE 
USING (
  job_request_id IN (
    SELECT id FROM job_requests WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  job_request_id IN (
    SELECT id FROM job_requests WHERE owner_id = auth.uid()
  )
);

-- Allow cleaners to update quotes they submitted
CREATE POLICY quotes_update_policy
ON quotes
FOR UPDATE
USING (cleaner_id = auth.uid())
WITH CHECK (cleaner_id = auth.uid());

-- Create a stored procedure for accepting quotes and updating cleaner_id
CREATE OR REPLACE FUNCTION accept_quote(
  _quote_id UUID,
  _job_request_id UUID,
  _cleaner_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Log the incoming parameters
  RAISE NOTICE 'Accept quote called with quote_id=%, job_request_id=%, cleaner_id=%', 
    _quote_id, _job_request_id, _cleaner_id;
  
  -- Update the job request status and cleaner_id
  UPDATE job_requests 
  SET 
    status = 'accepted',
    cleaner_id = _cleaner_id
  WHERE id = _job_request_id;
  
  -- Update the quote status to accepted
  UPDATE quotes
  SET status = 'accepted'
  WHERE id = _quote_id;
  
  -- Reject all other quotes for this job
  UPDATE quotes
  SET status = 'rejected'
  WHERE job_request_id = _job_request_id
  AND id != _quote_id;
  
  RAISE NOTICE 'Quote acceptance completed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;