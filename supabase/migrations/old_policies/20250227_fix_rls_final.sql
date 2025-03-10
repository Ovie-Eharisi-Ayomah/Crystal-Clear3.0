/*
  # Complete RLS policy reset to fix infinite recursion
  
  This migration:
  1. Lists all existing policies
  2. Drops all policies that could be causing recursion
  3. Creates minimal, non-recursive policies
*/

-- First, let's see all policies for these tables
-- SELECT * FROM pg_policies WHERE tablename IN ('profiles', 'properties', 'property_images', 'job_requests');

-- Now drop ALL policies for these tables to get a clean start
DROP POLICY IF EXISTS "Anyone can read property types" ON property_types;
DROP POLICY IF EXISTS "Users can manage their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles needed for job requests" ON profiles;
DROP POLICY IF EXISTS "Users can view their own properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Users can view properties for job requests" ON properties;
DROP POLICY IF EXISTS "Users can view their own property images" ON property_images;
DROP POLICY IF EXISTS "Users can add images to their properties" ON property_images;
DROP POLICY IF EXISTS "Users can delete their property images" ON property_images;
DROP POLICY IF EXISTS "Users can view property images for job requests" ON property_images;
DROP POLICY IF EXISTS "Homeowners can view their own job requests" ON job_requests;
DROP POLICY IF EXISTS "Cleaners can view assigned jobs" ON job_requests;
DROP POLICY IF EXISTS "Users can modify their own job requests" ON job_requests;
DROP POLICY IF EXISTS "Users can insert job requests" ON job_requests;

-- Recreate simple, non-recursive policies

-- 1. Property types - simple read-only for all users
CREATE POLICY "Anyone can read property types"
  ON property_types FOR SELECT
  TO authenticated
  USING (true);

-- 2. Profiles - minimal policies
CREATE POLICY "Users can manage their own profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Anyone can view any profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 3. Properties - minimal policies
CREATE POLICY "Users can manage their own properties"
  ON properties FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can view any property"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

-- 4. Property images - minimal policies
CREATE POLICY "Users can manage their own property images"
  ON property_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view any property image"
  ON property_images FOR SELECT
  TO authenticated
  USING (true);

-- 5. Job requests - minimal policies
CREATE POLICY "Homeowners can manage their own job requests"
  ON job_requests FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Cleaners can view available and assigned jobs"
  ON job_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'cleaner'
      AND (job_requests.status = 'new' OR job_requests.cleaner_id = auth.uid())
    )
  );