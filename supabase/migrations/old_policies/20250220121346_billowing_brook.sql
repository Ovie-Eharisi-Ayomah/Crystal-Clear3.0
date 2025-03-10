/*
  # Add social authentication support

  1. Changes
    - Add social_provider and social_id columns to profiles table
    - Add indexes for faster social provider lookups
    - Update user creation trigger to handle social logins
*/

-- Add social auth columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS social_provider text,
ADD COLUMN IF NOT EXISTS social_id text;

-- Add indexes for social auth lookups
CREATE INDEX IF NOT EXISTS profiles_social_lookup_idx 
ON profiles(social_provider, social_id);

-- Update the handle_new_user function to handle social providers
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    user_type,
    social_provider,
    social_id
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'homeowner'),
    NEW.raw_user_meta_data->>'provider',
    NEW.raw_user_meta_data->>'provider_id'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;