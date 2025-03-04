-- Fix infinite recursion in job_requests policy

-- First drop ALL existing policies for job_requests
DO $$ 
BEGIN
    -- Drop all existing policies for job_requests
    DROP POLICY IF EXISTS job_requests_select_policy ON job_requests;
    DROP POLICY IF EXISTS job_requests_insert_policy ON job_requests;
    DROP POLICY IF EXISTS job_requests_update_policy ON job_requests;
    DROP POLICY IF EXISTS job_requests_delete_policy ON job_requests;
    DROP POLICY IF EXISTS "Homeowners can manage their own job requests" ON job_requests;
    DROP POLICY IF EXISTS "Cleaners can view available and assigned jobs" ON job_requests;
    DROP POLICY IF EXISTS "homeowners_view_own_requests" ON job_requests;
    DROP POLICY IF EXISTS "cleaners_view_jobs" ON job_requests;
    DROP POLICY IF EXISTS "homeowners_insert_requests" ON job_requests;
    DROP POLICY IF EXISTS "homeowners_update_requests" ON job_requests;
    DROP POLICY IF EXISTS "homeowners_delete_requests" ON job_requests;
    
    RAISE NOTICE 'All existing job_requests policies dropped';
END $$;

-- Create simplified non-recursive policies

-- Get all existing policy names for job_requests to check what exists
DO $$ 
DECLARE
    policy_exists_select BOOLEAN;
    policy_exists_insert BOOLEAN;
    policy_exists_update BOOLEAN;
    policy_exists_delete BOOLEAN;
BEGIN
    -- Check if policies already exist
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_requests' AND policyname = 'homeowners_view_own_requests'
    ) INTO policy_exists_select;
    
    -- Create homeowners view policy if it doesn't exist
    IF NOT policy_exists_select THEN
        CREATE POLICY "homeowners_view_own_requests"
        ON job_requests FOR SELECT
        TO authenticated
        USING (
            -- Simple direct comparison without recursion
            owner_id = auth.uid()
        );
        RAISE NOTICE 'Created homeowners_view_own_requests policy';
    ELSE
        RAISE NOTICE 'Policy homeowners_view_own_requests already exists';
    END IF;
    
    -- Check if cleaner view policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_requests' AND policyname = 'cleaners_view_jobs'
    ) INTO policy_exists_select;
    
    -- Create cleaners view policy if it doesn't exist
    IF NOT policy_exists_select THEN
        CREATE POLICY "cleaners_view_jobs"
        ON job_requests FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.user_type = 'cleaner'
            ) AND
            (job_requests.status = 'new' OR job_requests.cleaner_id = auth.uid())
        );
        RAISE NOTICE 'Created cleaners_view_jobs policy';
    ELSE
        RAISE NOTICE 'Policy cleaners_view_jobs already exists';
    END IF;
    
    -- Check if insert policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_requests' AND policyname = 'homeowners_insert_requests'
    ) INTO policy_exists_insert;
    
    -- Create insert policy if it doesn't exist
    IF NOT policy_exists_insert THEN
        CREATE POLICY "homeowners_insert_requests"
        ON job_requests FOR INSERT
        TO authenticated
        WITH CHECK (
            owner_id = auth.uid()
        );
        RAISE NOTICE 'Created homeowners_insert_requests policy';
    ELSE
        RAISE NOTICE 'Policy homeowners_insert_requests already exists';
    END IF;
    
    -- Check if update policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_requests' AND policyname = 'homeowners_update_requests'
    ) INTO policy_exists_update;
    
    -- Create update policy if it doesn't exist
    IF NOT policy_exists_update THEN
        CREATE POLICY "homeowners_update_requests"
        ON job_requests FOR UPDATE
        TO authenticated
        USING (
            owner_id = auth.uid()
        )
        WITH CHECK (
            owner_id = auth.uid()
        );
        RAISE NOTICE 'Created homeowners_update_requests policy';
    ELSE
        RAISE NOTICE 'Policy homeowners_update_requests already exists';
    END IF;
    
    -- Check if delete policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_requests' AND policyname = 'homeowners_delete_requests'
    ) INTO policy_exists_delete;
    
    -- Create delete policy if it doesn't exist
    IF NOT policy_exists_delete THEN
        CREATE POLICY "homeowners_delete_requests"
        ON job_requests FOR DELETE
        TO authenticated
        USING (
            owner_id = auth.uid()
        );
        RAISE NOTICE 'Created homeowners_delete_requests policy';
    ELSE
        RAISE NOTICE 'Policy homeowners_delete_requests already exists';
    END IF;
END $$;