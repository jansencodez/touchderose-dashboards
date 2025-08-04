/*
  # Sample Data for Laundry Service Management Platform

  1. Sample Data
    - Demo admin and customer profiles
    - Sample bookings with items
    - Sample payments
    - Sample blog posts
    - Sample testimonials
    - Sample feedback

  2. Purpose
    - Provides realistic test data
    - Demonstrates all features
    - Enables immediate testing
*/

-- Insert sample profiles (these will be created when users sign up via auth)
-- Note: In production, these would be created automatically via the trigger

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
);

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
);

-- Insert sample feedback (some resolved, some pending)
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
);

-- Note: Bookings, booking_items, and payments would typically be created through the application
-- when users place orders. The following are examples of what the data structure would look like:

/*
Example booking data structure:
{
  "order_number": "ORD-20241229-0001",
  "pickup_date": "2024-12-30T10:00:00Z",
  "delivery_date": "2024-12-31T15:00:00Z",
  "time_slot": "10:00 AM - 12:00 PM",
  "address": "123 Main St, Apt 4B, New York, NY 10001",
  "special_instructions": "Please ring doorbell twice",
  "total": 2500, // $25.00 in cents
  "payment_method": "card",
  "payment_status": "completed",
  "booking_status": "confirmed"
}

Example booking items:
[
  {"name": "Dress Shirts", "quantity": 3, "price": 900}, // $9.00
  {"name": "Pants", "quantity": 2, "price": 800}, // $8.00
  {"name": "Dry Clean Suit", "quantity": 1, "price": 800} // $8.00
]
*/