-- Disable Quotes Policies Script
-- This script disables RLS on quotes to fix recursion issues

-- Disable RLS on quotes table
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;

-- Drop all existing quotes policies
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

-- Output confirmation
SELECT 'Quotes policies and RLS have been disabled' as message;