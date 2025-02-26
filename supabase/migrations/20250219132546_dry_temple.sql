/*
  # Initial Schema Setup for CrystalClear

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users id
      - `user_type` (text) - 'homeowner' or 'cleaner'
      - `full_name` (text)
      - `email` (text)
      - `phone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `properties`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, foreign key to profiles)
      - `address_line1` (text)
      - `address_line2` (text)
      - `city` (text)
      - `postcode` (text)
      - `property_type` (text)
      - `num_floors` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `job_requests`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `owner_id` (uuid, foreign key to profiles)
      - `cleaner_id` (uuid, foreign key to profiles, nullable)
      - `status` (text) - 'new', 'quoted', 'accepted', 'completed', 'cancelled'
      - `description` (text)
      - `preferred_date` (date)
      - `preferred_time` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `quotes`
      - `id` (uuid, primary key)
      - `job_request_id` (uuid, foreign key to job_requests)
      - `cleaner_id` (uuid, foreign key to profiles)
      - `amount` (decimal)
      - `message` (text)
      - `status` (text) - 'pending', 'accepted', 'rejected', 'withdrawn'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Set up appropriate access controls
*/

-- Create tables
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  user_type text NOT NULL CHECK (user_type IN ('homeowner', 'cleaner')),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  postcode text NOT NULL,
  property_type text NOT NULL,
  num_floors integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE job_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) NOT NULL,
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  cleaner_id uuid REFERENCES profiles(id),
  status text NOT NULL CHECK (status IN ('new', 'quoted', 'accepted', 'completed', 'cancelled')) DEFAULT 'new',
  description text,
  preferred_date date NOT NULL,
  preferred_time text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id uuid REFERENCES job_requests(id) NOT NULL,
  cleaner_id uuid REFERENCES profiles(id) NOT NULL,
  amount decimal(10,2) NOT NULL,
  message text,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Homeowners can create properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'homeowner'
    )
  );

CREATE POLICY "Users can view their own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Homeowners can create job requests"
  ON job_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'homeowner'
    )
  );

CREATE POLICY "Users can view relevant job requests"
  ON job_requests FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    cleaner_id = auth.uid() OR
    (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND user_type = 'cleaner'
      ) AND
      status = 'new'
    )
  );

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

CREATE POLICY "Users can view relevant quotes"
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

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'user_type'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();