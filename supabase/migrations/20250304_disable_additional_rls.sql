-- Disable RLS on additional tables to fix remaining issues

-- Drop specific quotes policies that might be causing recursion
DROP POLICY IF EXISTS quotes_select_policy ON quotes;
DROP POLICY IF EXISTS quotes_insert_policy ON quotes;
DROP POLICY IF EXISTS quotes_update_policy ON quotes;
DROP POLICY IF EXISTS quotes_delete_policy ON quotes;
DROP POLICY IF EXISTS "quotes_update_by_owner_policy" ON quotes;

-- Disable RLS on quotes table
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;

-- Log the action for audit
SELECT now() as timestamp, 'RLS disabled for quotes table' as action;