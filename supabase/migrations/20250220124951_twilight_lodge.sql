/*
  # Add window details to properties table

  1. Changes
    - Add num_windows column to properties table
    - Add window_types column to properties table as an array of types
    - Create window_types enum type for validation

  2. Security
    - Maintain existing RLS policies
*/

-- Create enum for window types
CREATE TYPE window_type AS ENUM (
  'sliding',
  'sash',
  'casement',
  'bay',
  'bow',
  'fixed',
  'skylight'
);

-- Add new columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS num_windows integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS window_types window_type[] NOT NULL DEFAULT '{}'::window_type[];

-- Add check constraint for num_windows
ALTER TABLE properties
ADD CONSTRAINT num_windows_positive CHECK (num_windows >= 0);