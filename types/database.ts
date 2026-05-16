export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================
// ENUMS
// ============================================
export type UserRole = "worker" | "hirer" | "admin";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentType = "worker_registration" | "chat_unlock";
export type AvailabilityStatus = "available" | "busy" | "unavailable";
export type ReportReason = "spam" | "fake_profile" | "inappropriate" | "fraud" | "other";

// ============================================
// TABLE ROW TYPES
// ============================================
export interface User {
  id: string;
  auth_id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole | null;
  phone_verified: boolean;
  is_active: boolean;
  is_banned: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface WorkerProfile {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string;
  experience_years: number;
  district: string;
  starting_price: number | null;
  availability: AvailabilityStatus;
  profile_image_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  avg_rating: number;
  total_reviews: number;
  total_jobs: number;
  search_vector?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkerPortfolio {
  id: string;
  worker_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  payment_type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payhere_order_id: string | null;
  payhere_payment_id: string | null;
  payhere_md5_hash: string | null;
  metadata: Json;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  hirer_id: string;
  worker_id: string;
  payment_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  worker_id: string;
  hirer_id: string;
  chat_id: string;
  rating: number;
  comment: string | null;
  is_flagged: boolean;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Json;
  created_at: string;
}

// ============================================
// JOINED / EXTENDED TYPES (used in queries)
// ============================================
export interface WorkerProfileWithDetails extends WorkerProfile {
  user: Pick<User, "id" | "full_name" | "avatar_url">;
  category: Pick<Category, "id" | "name" | "slug" | "icon">;
  portfolio: WorkerPortfolio[];
}

export interface ChatWithParticipants extends Chat {
  hirer: Pick<User, "id" | "full_name" | "avatar_url">;
  worker: Pick<User, "id" | "full_name" | "avatar_url">;
  worker_profile: Pick<WorkerProfile, "id" | "title" | "profile_image_url">;
  last_message?: Pick<Message, "content" | "created_at" | "is_read">;
  unread_count?: number;
}

export interface ReviewWithHirer extends Review {
  hirer: Pick<User, "id" | "full_name" | "avatar_url">;
}

// ============================================
// DATABASE SCHEMA TYPE (for Supabase client)
// ============================================
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<User, "id" | "auth_id" | "created_at">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      worker_profiles: {
        Row: WorkerProfile;
        Insert: Omit<WorkerProfile, "id" | "avg_rating" | "total_reviews" | "total_jobs" | "search_vector" | "created_at" | "updated_at">;
        Update: Partial<Omit<WorkerProfile, "id" | "user_id" | "search_vector" | "created_at">>;
      };
      worker_portfolio: {
        Row: WorkerPortfolio;
        Insert: Omit<WorkerPortfolio, "id" | "created_at">;
        Update: Partial<Omit<WorkerPortfolio, "id" | "worker_id" | "created_at">>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Payment, "id" | "user_id" | "created_at">>;
      };
      chats: {
        Row: Chat;
        Insert: Omit<Chat, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Chat, "id" | "created_at">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at">;
        Update: Partial<Pick<Message, "is_read">>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, "id" | "created_at">;
        Update: Partial<Omit<Review, "id" | "worker_id" | "hirer_id" | "created_at">>;
      };
      admin_logs: {
        Row: AdminLog;
        Insert: Omit<AdminLog, "id" | "created_at">;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_current_user_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      payment_status: PaymentStatus;
      payment_type: PaymentType;
      availability_status: AvailabilityStatus;
      report_reason: ReportReason;
    };
  };
}