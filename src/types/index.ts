export type UserRole = 'customer' | 'admin' | 'staff';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'mobile-money' | 'card' | 'cash';
export type FeedbackStatus = 'new' | 'in_review' | 'resolved' | 'closed';

export interface Profile {
  id: string;
  auth_user_id: string;
  username?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  order_number: string;
  pickup_date: string;
  delivery_date: string;
  time_slot: string;
  address: string;
  special_instructions: string;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  booking_items?: BookingItem[];
}

export interface BookingItem {
  id: string;
  booking_id: string;
  name: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  transaction_reference?: string;
  created_at: string;
  updated_at: string;
  booking?: Booking;
  profile?: Profile;
}

export interface Feedback {
  id: string;
  name: string;
  email: string;
  message: string;
  preferred_contact: string;
  status: FeedbackStatus;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  hashtags: string[];
  likes: number;
  liked_by: string[];
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  category: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}