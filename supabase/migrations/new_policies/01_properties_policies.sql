-- Properties Policies
-- This implements security policies for the properties table

-- First, enable RLS on the properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "properties_select_for_cleaners" ON properties;
DROP POLICY IF EXISTS "properties_select_policy" ON properties;
DROP POLICY IF EXISTS "properties_select_own" ON properties;
DROP POLICY IF EXISTS "properties_select_for_new_quoted_jobs" ON properties;
DROP POLICY IF EXISTS "properties_select_for_assigned_jobs" ON properties;
DROP POLICY IF EXISTS "properties_select_all" ON properties;
DROP POLICY IF EXISTS "properties_insert_own" ON properties;
DROP POLICY IF EXISTS "properties_update_own" ON properties;
DROP POLICY IF EXISTS "properties_delete_own" ON properties;

-- Create policy: Owners can see only their own properties
CREATE POLICY "properties_select_own" 
ON properties 
FOR SELECT 
USING (owner_id = auth.uid());

-- Create policy: Owners can only create properties assigned to themselves
CREATE POLICY "properties_insert_own" 
ON properties 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

-- Create policy: Owners can only update their own properties
CREATE POLICY "properties_update_own" 
ON properties 
FOR UPDATE 
USING (owner_id = auth.uid());

-- Create policy: Owners can only delete their own properties
CREATE POLICY "properties_delete_own" 
ON properties 
FOR DELETE 
USING (owner_id = auth.uid());

-- Output confirmation
SELECT 'Properties policies created successfully' as message;