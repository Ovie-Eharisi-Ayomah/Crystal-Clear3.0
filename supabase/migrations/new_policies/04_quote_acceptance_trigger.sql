-- Quote Acceptance Trigger
-- This creates a trigger that sets job_requests.cleaner_id when a quote is accepted

-- Create or replace the function that will be executed by the trigger
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

-- Output confirmation
SELECT 'Quote acceptance trigger created successfully' as message;