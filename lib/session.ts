import { createClient } from "@/lib/supabase/server";
import type { AuthUser } from "@/types/actions";
import type { User } from "@/types/database";

// ============================================
// GET SESSION USER
// Returns null if not authenticated
// ============================================
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) return null;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, phone, role, phone_verified, avatar_url")
      .eq("auth_id", authUser.id)
      .single();

    if (userError || !user) return null;

    return user as AuthUser;
  } catch {
    return null;
  }
}

// ============================================
// GET FULL USER RECORD
// ============================================
export async function getFullUser(): Promise<User | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .single();

    return user ?? null;
  } catch {
    return null;
  }
}

// ============================================
// REQUIRE AUTH — use in server components
// Redirects to login if not authenticated
// ============================================
export async function requireAuth(): Promise<AuthUser> {
  const { redirect } = await import("next/navigation");
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

// ============================================
// REQUIRE ROLE
// ============================================
export async function requireRole(
  role: "worker" | "hirer" | "admin"
): Promise<AuthUser> {
  const { redirect } = await import("next/navigation");
  const user = await requireAuth();

  if (user.role !== role) {
    redirect("/dashboard");
  }

  return user;
}

// ============================================
// REQUIRE PHONE VERIFIED
// ============================================
export async function requirePhoneVerified(): Promise<AuthUser> {
  const { redirect } = await import("next/navigation");
  const user = await requireAuth();

  if (!user.phone_verified) {
    redirect("/verify-otp");
  }

  return user;
}

// ============================================
// CHECK IF WORKER HAS PAID
// ============================================
export async function checkWorkerPayment(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("payments")
      .select("id")
      .eq("user_id", userId)
      .eq("payment_type", "worker_registration")
      .eq("status", "completed")
      .single();

    return !!data;
  } catch {
    return false;
  }
}

// ============================================
// CHECK IF CHAT IS UNLOCKED
// ============================================
export async function checkChatUnlocked(
  hirerId: string,
  workerId: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("chats")
      .select("id")
      .eq("hirer_id", hirerId)
      .eq("worker_id", workerId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}