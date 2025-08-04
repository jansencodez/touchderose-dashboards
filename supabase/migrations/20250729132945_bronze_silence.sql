/*
  # Backfill existing auth users to public.profiles table

  1. Purpose
    - Creates user profiles for existing auth.users who don't have profiles yet
    - Handles cases where users were created before the trigger was implemented

  2. Process
    - Identifies auth.users without corresponding public.profiles records
    - Creates profiles with default values and available metadata
    - Maintains data integrity and consistency

  3. Safety
    - Only processes users that don't already have profiles
    - Uses LEFT JOIN to prevent duplicates
*/

-- Backfill existing auth users who don't have profiles
INSERT INTO public.profiles (
  auth_user_id,
  email,
  name,
  phone,
  username,
  role,
  points,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email, 'User'),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  COALESCE(au.raw_user_meta_data->>'username', NULL),
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'customer'),
  0,
  au.created_at,
  au.updated_at
FROM auth.users au
LEFT JOIN public.profiles pu ON au.id = pu.auth_user_id
WHERE pu.auth_user_id IS NULL;

-- Update the updated_at timestamp for consistency
UPDATE public.profiles 
SET updated_at = now() 
WHERE updated_at IS NULL OR updated_at < created_at;