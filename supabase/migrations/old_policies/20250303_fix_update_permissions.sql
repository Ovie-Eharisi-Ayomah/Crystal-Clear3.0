-- This migration specifically addresses the cleaner_id field update issue
-- First make sure we can update job_requests regardless of clauses
ALTER TABLE job_requests DISABLE ROW LEVEL SECURITY;

-- Create a more permissive RLS policy directly for job_requests
DROP POLICY IF EXISTS job_requests_update_policy ON job_requests;

-- Re-enable RLS with a permissive policy for updating
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows any authenticated user to read 
CREATE POLICY job_requests_select_policy 
ON job_requests 
FOR SELECT 
USING (true);

-- Create a policy that allows the owner to insert
CREATE POLICY job_requests_insert_policy 
ON job_requests 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

-- Create a policy that allows the owner to update with no column restrictions
CREATE POLICY job_requests_update_policy 
ON job_requests 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (true);

-- Create a policy that allows the owner to delete
CREATE POLICY job_requests_delete_policy 
ON job_requests 
FOR DELETE 
USING (owner_id = auth.uid());

-- Add notify function for debugging
CREATE OR REPLACE FUNCTION notify_job_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE NOTICE 'Job request updated: id=%, cleaner_id=%', NEW.id, NEW.cleaner_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_update_trigger ON job_requests;

CREATE TRIGGER job_update_trigger
AFTER UPDATE ON job_requests
FOR EACH ROW
EXECUTE FUNCTION notify_job_update();