// ============================================
// SERVER ACTION RETURN TYPES
// ============================================
// All server actions return this shape so the
// client always knows what to expect.

export type ActionResult<T = undefined> =
  | { success: true;  data?: T;      message?: string }
  | { success: false; error: string; field?: string };

// ============================================
// AUTH SPECIFIC RETURN DATA
// ============================================
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "worker" | "hirer" | "admin" | null;
  phone_verified: boolean;
  avatar_url: string | null;
}

export interface RegisterResult {
  user_id: string;
  phone: string;
  email: string;
}

export interface LoginResult {
  user: AuthUser;
  redirect_to: string;
}

export interface OtpResult {
  phone: string;
  expires_in: number; // seconds
}