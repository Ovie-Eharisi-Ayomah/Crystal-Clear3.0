-- Profiles Policies
-- This implements security policies for the profiles table

-- First, enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "profiles_select_for_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_for_jobs" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create policy: All authenticated users can see all profiles
-- This avoids recursion issues when profiles are joined with other tables
CREATE POLICY "profiles_select_all" 
ON profiles 
FOR SELECT 
USING (true);

-- Create policy: Users can only update their own profile
CREATE POLICY "profiles_update_own" 
ON profiles 
FOR UPDATE 
USING (id = auth.uid());

-- Output confirmation
SELECT 'Profiles policies created successfully' as message;