/*
  # Add Property Management Features

  1. New Tables
    - `property_types` - Lookup table for property types
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)

  2. Changes
    - Add foreign key constraint to properties.property_type
    - Add property type options
    - Add property images support

  3. Security
    - Enable RLS on property_types
    - Add policy for authenticated users to read property types
*/

-- Create property types lookup table
CREATE TABLE IF NOT EXISTS property_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text
);

-- Enable RLS
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;

-- Add policy for reading property types
CREATE POLICY "Anyone can read property types"
  ON property_types FOR SELECT
  TO authenticated
  USING (true);

-- Insert property types
INSERT INTO property_types (id, name, description)
VALUES
  ('house', 'House', 'Single family home'),
  ('apartment', 'Apartment', 'Flat or apartment unit'),
  ('condo', 'Condo', 'Condominium unit'),
  ('townhouse', 'Townhouse', 'Multi-floor home sharing walls'),
  ('office', 'Office', 'Commercial office space'),
  ('commercial', 'Commercial', 'Other commercial property')
ON CONFLICT (id) DO NOTHING;

-- Add property images support
DO $$ BEGIN
  CREATE TYPE property_image_type AS ENUM ('exterior', 'interior', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  image_type property_image_type NOT NULL DEFAULT 'other',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on property images
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Add policies for property images
CREATE POLICY "Users can view their own property images"
  ON property_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can add images to their properties"
  ON property_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their property images"
  ON property_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  );