/*
  # Add profile fields

  1. Changes
    - Add contact and business information fields to profiles table:
      - phone (text)
      - business_name (text)
      - service_radius (integer)
      - hourly_rate (decimal)
      - insurance_number (text)
      - contact_address (text)

  2. Notes
    - All new fields are nullable to support both user types
    - business_name, service_radius, hourly_rate, and insurance_number are primarily for cleaners
    - phone and contact_address are for all users
*/

DO $$ 
BEGIN
  -- Add phone number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  -- Add business name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN business_name text;
  END IF;

  -- Add service radius
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'service_radius'
  ) THEN
    ALTER TABLE profiles ADD COLUMN service_radius integer;
  END IF;

  -- Add hourly rate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hourly_rate decimal(10,2);
  END IF;

  -- Add insurance number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'insurance_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN insurance_number text;
  END IF;

  -- Add contact address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'contact_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN contact_address text;
  END IF;
END $$;