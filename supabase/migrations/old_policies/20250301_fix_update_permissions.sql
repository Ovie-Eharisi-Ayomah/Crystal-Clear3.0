-- Grant permissions for job_requests table to update cleaner_id
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;

-- Allow homeowners to update job_requests they own
CREATE POLICY job_requests_update_policy 
ON job_requests 
FOR UPDATE 
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Allow cleaners to update quotes they submitted
CREATE POLICY quotes_update_policy
ON quotes
FOR UPDATE
USING (cleaner_id = auth.uid())
WITH CHECK (cleaner_id = auth.uid());

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

-- Add necessary triggers for tracking updates
CREATE OR REPLACE FUNCTION update_job_quote_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Log that the function was called and with what values
  RAISE NOTICE 'update_job_quote_status triggered: old_status=%, new_status=%, cleaner_id=%', 
    OLD.status, NEW.status, NEW.cleaner_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_quote_status_update_trigger
AFTER UPDATE ON job_requests
FOR EACH ROW
EXECUTE FUNCTION update_job_quote_status();