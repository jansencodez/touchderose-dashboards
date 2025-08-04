-- Create profiles table with all constraints and indexes
CREATE TABLE public.profiles (
  id uuid not null default gen_random_uuid (),
  auth_user_id uuid null,
  username text null,
  name text null default ''::text,
  email text not null,
  phone text null default ''::text,
  role public.user_role null default 'customer'::user_role,
  points integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_username_key unique (username),
  constraint profiles_auth_user_id_fkey foreign KEY (auth_user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles USING btree (auth_user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role) TABLESPACE pg_default;

-- Create trigger for updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE
UPDATE ON profiles FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (public.is_admin()); 