/*
  # Complete Laundry Service Management Platform Schema

  1. New Tables
    - `profiles` - User profiles and authentication
    - `bookings` - Laundry service bookings
    - `booking_items` - Individual items in bookings
    - `payments` - Payment records
    - `feedbacks` - Customer feedback
    - `posts` - Blog posts
    - `testimonials` - Customer testimonials

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin-only access for management tables
    - Security definer function to prevent RLS recursion

  3. Features
    - UUID primary keys
    - Proper foreign key relationships
    - Timestamps for audit trails
    - Enums for status fields
    - Comprehensive indexing
    - Automatic profile creation
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create custom types
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('mobile-money', 'card', 'cash');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_status AS ENUM ('new', 'in_review', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create security definer function to check admin status (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles 
  WHERE auth_user_id = auth.uid();
  
  RETURN user_role IN ('admin', 'staff');
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  name text DEFAULT '',
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  role user_role DEFAULT 'customer',
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  pickup_date timestamptz NOT NULL,
  delivery_date timestamptz NOT NULL,
  time_slot text NOT NULL,
  address text NOT NULL,
  special_instructions text DEFAULT '',
  total integer NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  booking_status booking_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Booking items table
CREATE TABLE IF NOT EXISTS booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  transaction_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Feedbacks table
CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  preferred_contact text DEFAULT 'email',
  status feedback_status DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Posts table (blog)
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text DEFAULT '',
  author text NOT NULL,
  category text DEFAULT 'General',
  hashtags text[] DEFAULT '{}',
  likes integer DEFAULT 0,
  liked_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text,
  content text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  text text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Profiles policies
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

-- Drop existing booking policies
DROP POLICY IF EXISTS "Users can read own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can read all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;

-- Bookings policies
CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Drop existing booking items policies
DROP POLICY IF EXISTS "Users can read own booking items" ON booking_items;
DROP POLICY IF EXISTS "Users can create own booking items" ON booking_items;
DROP POLICY IF EXISTS "Users can update own booking items" ON booking_items;
DROP POLICY IF EXISTS "Admins can manage all booking items" ON booking_items;

-- Booking items policies
CREATE POLICY "Users can read own booking items"
  ON booking_items FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE user_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create own booking items"
  ON booking_items FOR INSERT
  TO authenticated
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE user_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own booking items"
  ON booking_items FOR UPDATE
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE user_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage all booking items"
  ON booking_items FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Drop existing payment policies
DROP POLICY IF EXISTS "Users can read own payments" ON payments;
DROP POLICY IF EXISTS "Users can create own payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;

-- Payments policies
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM profiles WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payments"
  ON payments FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Drop existing feedback policies
DROP POLICY IF EXISTS "Anyone can create feedback" ON feedbacks;
DROP POLICY IF EXISTS "Admins can manage all feedbacks" ON feedbacks;

-- Feedbacks policies
CREATE POLICY "Anyone can create feedback"
  ON feedbacks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all feedbacks"
  ON feedbacks FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Drop existing post policies
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON posts;

-- Posts policies
CREATE POLICY "Anyone can read posts"
  ON posts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage all posts"
  ON posts FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Drop existing comment policies
DROP POLICY IF EXISTS "Anyone can read approved comments" ON post_comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON post_comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON post_comments;

-- Post comments policies
CREATE POLICY "Anyone can read approved comments"
  ON post_comments FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

CREATE POLICY "Anyone can create comments"
  ON post_comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all comments"
  ON post_comments FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Drop existing testimonial policies
DROP POLICY IF EXISTS "Anyone can read approved testimonials" ON testimonials;
DROP POLICY IF EXISTS "Anyone can create testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admins can manage all testimonials" ON testimonials;

-- Testimonials policies
CREATE POLICY "Anyone can read approved testimonials"
  ON testimonials FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

CREATE POLICY "Anyone can create testimonials"
  ON testimonials FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all testimonials"
  ON testimonials FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_order_number ON bookings(order_number);
CREATE INDEX IF NOT EXISTS idx_booking_items_booking_id ON booking_items(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(is_approved);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedbacks_updated_at ON feedbacks;
CREATE TRIGGER update_feedbacks_updated_at BEFORE UPDATE ON feedbacks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_testimonials_updated_at ON testimonials;
CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
BEGIN
    RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create profile for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample blog posts
INSERT INTO posts (title, content, excerpt, author, category, hashtags, likes) VALUES
(
  'Essential Laundry Tips for Busy Professionals',
  'As a busy professional, keeping your clothes clean and well-maintained can be challenging. Here are some essential tips to help you manage your laundry efficiently:

1. **Sort your clothes properly** - Separate whites, colors, and delicates
2. **Pre-treat stains immediately** - The sooner you treat a stain, the better
3. **Use the right water temperature** - Hot for whites, cold for colors
4. **Don''t overload your machine** - This can damage clothes and reduce cleaning effectiveness
5. **Read care labels** - They contain important washing instructions

Following these simple tips will help extend the life of your clothes and keep them looking their best.',
  'Learn essential laundry tips that will help busy professionals keep their clothes clean and well-maintained.',
  'LaundryPro Team',
  'Tips & Tricks',
  ARRAY['laundry', 'tips', 'professional', 'care'],
  15
),
(
  'The Benefits of Professional Laundry Services',
  'Professional laundry services offer numerous advantages over doing laundry at home:

**Time Savings**: Free up hours in your week for more important activities.

**Professional Results**: Our experienced team knows how to handle different fabrics and stains.

**Convenience**: Pickup and delivery services bring the laundry to you.

**Equipment**: Industrial-grade machines provide superior cleaning.

**Expertise**: Professional handling of delicate items and special fabrics.

**Cost-Effective**: When you factor in time, utilities, and equipment costs, professional services often provide better value.',
  'Discover why professional laundry services are becoming increasingly popular among busy individuals and families.',
  'Sarah Johnson',
  'Services',
  ARRAY['professional', 'services', 'convenience', 'benefits'],
  23
),
(
  'Eco-Friendly Laundry Practices',
  'At LaundryPro, we''re committed to environmental sustainability. Here''s how we''re making a difference:

**Energy-Efficient Equipment**: Our machines use 40% less energy than standard models.

**Biodegradable Detergents**: We use eco-friendly cleaning products that are safe for the environment.

**Water Conservation**: Advanced systems recycle and reuse water where possible.

**Reduced Chemical Usage**: Our processes minimize harsh chemicals while maintaining cleaning effectiveness.

**Sustainable Packaging**: We use recyclable and biodegradable packaging materials.

Join us in making laundry more sustainable for future generations.',
  'Learn about our commitment to eco-friendly laundry practices and how you can contribute to environmental sustainability.',
  'Mike Chen',
  'Environment',
  ARRAY['eco-friendly', 'sustainability', 'environment', 'green'],
  31
),
(
  'How to Remove Common Stains',
  'Stain removal can be tricky, but with the right techniques, most stains can be eliminated:

**Blood Stains**: Rinse with cold water immediately, then treat with hydrogen peroxide.

**Grease Stains**: Apply dish soap directly to the stain and let it sit for 10 minutes before washing.

**Wine Stains**: Blot immediately, then treat with salt and cold water.

**Sweat Stains**: Pre-treat with a mixture of baking soda and water.

**Ink Stains**: Dab with rubbing alcohol using a cotton ball.

**Grass Stains**: Pre-treat with enzyme-based detergent.

Remember: Always test stain removal methods on an inconspicuous area first!',
  'Master the art of stain removal with these proven techniques for common household stains.',
  'Emma Davis',
  'Tips & Tricks',
  ARRAY['stains', 'removal', 'cleaning', 'tips'],
  18
) ON CONFLICT DO NOTHING;

-- Insert sample testimonials
INSERT INTO testimonials (name, text, is_approved) VALUES
(
  'Jennifer Martinez',
  'LaundryPro has been a lifesaver! As a working mom of three, I barely have time to breathe, let alone do laundry. Their pickup and delivery service is incredibly convenient, and my clothes always come back perfectly clean and folded. The staff is friendly and professional. I highly recommend their services!',
  true
),
(
  'David Thompson',
  'I''ve been using LaundryPro for over a year now, and I''m consistently impressed with their quality. They handle my business shirts with care, and the dry cleaning service is top-notch. The online booking system is easy to use, and they''re always on time. Worth every penny!',
  true
),
(
  'Lisa Wang',
  'Excellent service! I had a wine stain on my favorite dress that I thought was ruined forever. LaundryPro not only removed the stain completely but also made the dress look brand new. Their attention to detail is remarkable. I won''t trust my clothes to anyone else.',
  true
),
(
  'Robert Johnson',
  'The convenience factor is unbeatable. I schedule my pickups through the app, and they handle everything else. My clothes are always returned clean, pressed, and ready to wear. The pricing is fair, and the service is reliable. Highly recommended for busy professionals.',
  true
),
(
  'Maria Rodriguez',
  'LaundryPro saved my wedding dress! I spilled coffee on it the morning of my wedding, and they worked miracles to get it clean in just a few hours. The emergency service was a lifesaver. Thank you for making my special day perfect!',
  true
) ON CONFLICT DO NOTHING;

-- Insert sample feedback
INSERT INTO feedbacks (name, email, message, preferred_contact, status) VALUES
(
  'John Smith',
  'john.smith@email.com',
  'I love the service overall, but I think the pickup times could be more flexible. It would be great to have evening pickup options for those of us who work late.',
  'email',
  'resolved'
),
(
  'Amanda Wilson',
  'amanda.w@email.com',
  'The quality of service is excellent, but I had an issue with a missing sock from my last order. Could you please look into this?',
  'phone',
  'in_review'
),
(
  'Carlos Mendez',
  'carlos.mendez@email.com',
  'Suggestion: It would be helpful to have SMS notifications when my laundry is ready for pickup. The email notifications sometimes get lost in my inbox.',
  'both',
  'new'
),
(
  'Rachel Green',
  'rachel.green@email.com',
  'I''m very satisfied with the service! Just wanted to suggest adding more eco-friendly detergent options. Keep up the great work!',
  'email',
  'resolved'
) ON CONFLICT DO NOTHING;