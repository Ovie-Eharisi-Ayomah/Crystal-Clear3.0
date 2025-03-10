-- Reviews Policies
-- This implements security policies for the reviews table

-- First, enable RLS on the reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;

-- Create policy: All authenticated users can see all reviews
CREATE POLICY "reviews_select_all" 
ON reviews 
FOR SELECT 
USING (true);

-- Create policy: Users can create reviews for completed jobs
CREATE POLICY "reviews_insert" 
ON reviews 
FOR INSERT 
WITH CHECK (reviewer_id = auth.uid());

-- Create policy: Users can update their own reviews
CREATE POLICY "reviews_update_own" 
ON reviews 
FOR UPDATE 
USING (reviewer_id = auth.uid());

-- Create policy: Users can delete their own reviews
CREATE POLICY "reviews_delete_own" 
ON reviews 
FOR DELETE 
USING (reviewer_id = auth.uid());

-- Output confirmation
SELECT 'Reviews policies created successfully' as message;