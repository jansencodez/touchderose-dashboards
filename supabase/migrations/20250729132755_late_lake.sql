@@ .. @@
 ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
 
--- Create security definer function to check admin status (prevents RLS recursion)
-CREATE OR REPLACE FUNCTION auth.is_admin()
+-- Create security definer function to check admin status in public schema
+CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean AS $$
 DECLARE
   user_role text;
@@ .. @@
 CREATE POLICY "Admins can read all profiles"
   ON profiles FOR SELECT
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 CREATE POLICY "Admins can update all profiles"
   ON profiles FOR UPDATE
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 CREATE POLICY "Admins can insert profiles"
   ON profiles FOR INSERT
   TO authenticated
-  WITH CHECK (auth.is_admin());
+  WITH CHECK (public.is_admin());
 
 CREATE POLICY "Admins can delete profiles"
   ON profiles FOR DELETE
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 -- Bookings policies
@@ .. @@
 CREATE POLICY "Admins can read all bookings"
   ON bookings FOR SELECT
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 CREATE POLICY "Admins can update all bookings"
   ON bookings FOR UPDATE
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 CREATE POLICY "Admins can insert bookings"
   ON bookings FOR INSERT
   TO authenticated
-  WITH CHECK (auth.is_admin());
+  WITH CHECK (public.is_admin());
 
 CREATE POLICY "Admins can delete bookings"
   ON bookings FOR DELETE
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 -- Booking items policies
@@ .. @@
 CREATE POLICY "Admins can manage all booking items"
   ON booking_items FOR ALL
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 -- Payments policies
@@ .. @@
 CREATE POLICY "Admins can manage all payments"
   ON payments FOR ALL
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 -- Feedbacks policies
@@ .. @@
 CREATE POLICY "Admins can manage all feedbacks"
   ON feedbacks FOR ALL
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 -- Posts policies
@@ .. @@
 CREATE POLICY "Admins can manage all posts"
   ON posts FOR ALL
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 -- Post comments policies
@@ .. @@
 CREATE POLICY "Admins can manage all comments"
   ON post_comments FOR ALL
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 -- Testimonials policies
@@ .. @@
 CREATE POLICY "Admins can manage all testimonials"
   ON testimonials FOR ALL
   TO authenticated
-  USING (auth.is_admin());
+  USING (public.is_admin());
 
 -- Create indexes for better performance