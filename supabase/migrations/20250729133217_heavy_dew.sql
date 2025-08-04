@@ .. @@
 -- Create custom types
 CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
 CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
 CREATE TYPE payment_method AS ENUM ('mobile-money', 'card', 'cash');
 CREATE TYPE user_role AS ENUM ('customer', 'admin', 'staff');
 CREATE TYPE feedback_status AS ENUM ('new', 'in_review', 'resolved', 'closed');
 
+-- Function to automatically create profile when user signs up
+CREATE OR REPLACE FUNCTION public.handle_new_user()
+RETURNS trigger AS $$
+BEGIN
+  INSERT INTO public.profiles (auth_user_id, email, name, role)
+  VALUES (
+    NEW.id,
+    NEW.email,
+    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
+    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
+  );
+  RETURN NEW;
+END;
+$$ LANGUAGE plpgsql SECURITY DEFINER;
+
 -- Profiles table (extends Supabase auth.users)
@@ .. @@
 CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
 
--- Function to automatically create profile when user signs up
-CREATE OR REPLACE FUNCTION public.handle_new_user()
-RETURNS trigger AS $$
-BEGIN
-  INSERT INTO public.profiles (auth_user_id, email, name, role)
-  VALUES (
-    NEW.id,
-    NEW.email,
-    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'User'),
-    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
-  );
-  RETURN NEW;
-END;
-$$ LANGUAGE plpgsql SECURITY DEFINER;
-
 -- Trigger to automatically create profile for new users