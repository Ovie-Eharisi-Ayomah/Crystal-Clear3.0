/*
  # Add quotes table and related functionality

  1. New Tables
    - `quotes` table for storing cleaner quotes on job requests
      - `id` (uuid, primary key)
      - `job_request_id` (uuid, references job_requests)
      - `cleaner_id` (uuid, references profiles)
      - `amount` (decimal)
      - `message` (text)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on quotes table
    - Add policies for quote management
*/

-- Create quotes table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_request_id uuid REFERENCES job_requests(id) ON DELETE CASCADE,
    cleaner_id uuid REFERENCES profiles(id),
    amount decimal(10,2) NOT NULL,
    message text,
    status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Enable RLS if not already enabled
DO $$ BEGIN
  ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Drop existing policies to avoid conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Cleaners can create quotes" ON quotes;
  DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
  DROP POLICY IF EXISTS "Cleaners can update their own quotes" ON quotes;
END $$;

-- Create policies for quotes
CREATE POLICY "Cleaners can create quotes"
  ON quotes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'cleaner'
    )
  );

CREATE POLICY "Users can view their own quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (
    cleaner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM job_requests
      WHERE job_requests.id = quotes.job_request_id
      AND job_requests.owner_id = auth.uid()
    )
  );

CREATE POLICY "Cleaners can update their own quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (cleaner_id = auth.uid())
  WITH CHECK (cleaner_id = auth.uid());

-- Create indexes for faster lookups if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS quotes_job_request_id_idx ON quotes(job_request_id);
  CREATE INDEX IF NOT EXISTS quotes_cleaner_id_idx ON quotes(cleaner_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;