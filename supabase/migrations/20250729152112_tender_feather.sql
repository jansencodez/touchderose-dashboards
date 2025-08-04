/*
  # Create Settings Table

  1. New Table
    - `settings` - Application configuration settings
    - Key-value pairs with metadata
    - JSON support for complex settings

  2. Security
    - Enable RLS
    - Only admins can manage settings
    - Public read access for certain settings

  3. Features
    - Flexible key-value storage
    - JSON support for complex configurations
    - Categories for organization
    - Default values and descriptions
*/

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  category text DEFAULT 'general',
  description text DEFAULT '',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Public can read public settings"
  ON settings FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "Authenticated can read all settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all settings"
  ON settings FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_public ON settings(is_public);

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value, category, description, is_public) VALUES
-- General Settings
('site_name', '"Touch De Rose"', 'general', 'Name of the application', true),
('site_description', '"Premium laundry service with a personal touch"', 'general', 'Site description', true),
('contact_email', '"support@touchderose.com"', 'general', 'Primary contact email', true),
('contact_phone', '"+1 (555) 123-4567"', 'general', 'Primary contact phone', true),

-- Business Hours
('business_hours', '{
  "monday": {"open": "08:00", "close": "20:00", "closed": false},
  "tuesday": {"open": "08:00", "close": "20:00", "closed": false},
  "wednesday": {"open": "08:00", "close": "20:00", "closed": false},
  "thursday": {"open": "08:00", "close": "20:00", "closed": false},
  "friday": {"open": "08:00", "close": "20:00", "closed": false},
  "saturday": {"open": "09:00", "close": "18:00", "closed": false},
  "sunday": {"open": "09:00", "close": "18:00", "closed": true}
}', 'business', 'Business operating hours', true),

-- Notification Settings
('email_notifications', 'true', 'notifications', 'Enable email notifications', false),
('sms_notifications', 'false', 'notifications', 'Enable SMS notifications', false),
('push_notifications', 'true', 'notifications', 'Enable push notifications', false),

-- Payment Settings
('accept_cash', 'true', 'payments', 'Accept cash payments', true),
('accept_card', 'true', 'payments', 'Accept card payments', true),
('accept_mobile_money', 'true', 'payments', 'Accept mobile money payments', true),

-- Service Settings
('minimum_order_amount', '1000', 'services', 'Minimum order amount in cents', true),
('delivery_fee', '500', 'services', 'Delivery fee in cents', true),
('free_delivery_threshold', '5000', 'services', 'Free delivery threshold in cents', true),

-- Feature Flags
('booking_enabled', 'true', 'features', 'Enable online booking', true),
('testimonials_enabled', 'true', 'features', 'Enable testimonials display', true),
('blog_enabled', 'true', 'features', 'Enable blog functionality', true),
('rewards_enabled', 'true', 'features', 'Enable rewards system', true)

ON CONFLICT (key) DO NOTHING;