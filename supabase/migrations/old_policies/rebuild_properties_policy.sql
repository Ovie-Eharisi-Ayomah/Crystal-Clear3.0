-- Simplified Properties Policies
-- This script fixes the properties policies to avoid recursion

-- First, disable RLS temporarily to allow us to reset policies
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for properties
DROP POLICY IF EXISTS "properties_select_for_cleaners" ON properties;
DROP POLICY IF EXISTS "properties_select_policy" ON properties;
DROP POLICY IF EXISTS "properties_select_own" ON properties;
DROP POLICY IF EXISTS "properties_select_for_new_quoted_jobs" ON properties;
DROP POLICY IF EXISTS "properties_select_for_assigned_jobs" ON properties;

-- Re-enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated users to read properties
-- This is the simplest approach to fix recursion issues
CREATE POLICY "properties_select_all" 
ON properties 
FOR SELECT 
USING (true);

-- Add insert/update/delete policies for proper security
CREATE POLICY "properties_insert_own" 
ON properties 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "properties_update_own" 
ON properties 
FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "properties_delete_own" 
ON properties 
FOR DELETE 
USING (owner_id = auth.uid());

-- Verification
SELECT 
  policyname,
  permissive,
  cmd
FROM 
  pg_policies 
WHERE 
  tablename = 'properties'
ORDER BY 
  policyname;