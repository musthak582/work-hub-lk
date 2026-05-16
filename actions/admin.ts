"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";

// ============================================
// ADMIN GUARD
// ============================================
async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // ensure email exists
  if (!user.email) return null;

  if (user.email !== process.env.ADMIN_EMAIL) {
    return null;
  }

  return user.email;
}

// ============================================
// LOG ADMIN ACTION
// ============================================
async function logAdminAction(
  adminEmail: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  const adminSupabase = createAdminClient();

  const logData = {
    admin_email: adminEmail,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
    details: details ?? {},
  };

  await adminSupabase
    .from("admin_logs")
    .insert(logData as never);
}

// ============================================
// GET DASHBOARD STATS
// ============================================
export async function getAdminStatsAction() {
  const admin = await requireAdmin();
  if (!admin) return null;

  const adminSupabase = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalWorkers },
    { count: totalHirers },
    { count: totalPayments },
    { count: pendingPayments },
    { count: totalChats },
    { count: totalReviews },
    recentPaymentsResult,
    { count: bannedUsers },
  ] = await Promise.all([
    adminSupabase.from("users").select("id", { count: "exact" }),
    adminSupabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("role", "worker"),
    adminSupabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("role", "hirer"),
    adminSupabase
      .from("payments")
      .select("id", { count: "exact" })
      .eq("status", "completed"),
    adminSupabase
      .from("payments")
      .select("id", { count: "exact" })
      .eq("status", "pending"),
    adminSupabase.from("chats").select("id", { count: "exact" }),
    adminSupabase.from("reviews").select("id", { count: "exact" }),
    adminSupabase
      .from("payments")
      .select("amount, created_at, status")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(30),
    adminSupabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("is_banned", true),
  ]);

  const recentPayments =
    (recentPaymentsResult?.data as
      | { amount?: string | number | null; created_at?: string | null; status?: string | null }[]
      | null) ?? [];

  const totalRevenue = recentPayments.reduce(
    (s, p) => s + Number(p.amount ?? 0),
    0
  );

  return {
    totalUsers: totalUsers ?? 0,
    totalWorkers: totalWorkers ?? 0,
    totalHirers: totalHirers ?? 0,
    totalPayments: totalPayments ?? 0,
    pendingPayments: pendingPayments ?? 0,
    totalChats: totalChats ?? 0,
    totalReviews: totalReviews ?? 0,
    totalRevenue,
    bannedUsers: bannedUsers ?? 0,
  };
}

// ============================================
// GET USERS (paginated)
// ============================================
export async function getAdminUsersAction(
  page = 1,
  search = "",
  role?: string
) {
  const admin = await requireAdmin();
  if (!admin) return { users: [], total: 0 };

  const adminSupabase = createAdminClient();
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  let query = adminSupabase
    .from("users")
    .select("id, full_name, email, phone, role, phone_verified, is_active, is_banned, created_at", {
      count: "exact",
    });

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  if (role) query = query.eq("role", role);

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data, count } = await query;
  return { users: data ?? [], total: count ?? 0 };
}

// ============================================
// BAN USER
// ============================================
export async function banUserAction(
  userId: string, reason: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized." };

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("users")
    .update({ is_banned: true, is_active: false })
    .eq("id", userId);

  if (error) return { success: false, error: "Failed to ban user." };

  await logAdminAction(admin, "ban_user", "user", userId, { reason });
  revalidatePath("/admin/users");

  return { success: true, message: "User banned." };
}

// ============================================
// UNBAN USER
// ============================================
export async function unbanUserAction(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized." };

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("users")
    .update({ is_banned: false, is_active: true })
    .eq("id", userId);

  if (error) return { success: false, error: "Failed to unban user." };

  await logAdminAction(admin, "unban_user", "user", userId);
  revalidatePath("/admin/users");

  return { success: true, message: "User unbanned." };
}

// ============================================
// VERIFY WORKER
// ============================================
export async function verifyWorkerAction(
  profileId: string
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized." };

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("worker_profiles")
    .update({ is_verified: true })
    .eq("id", profileId);

  if (error) return { success: false, error: "Failed to verify worker." };

  await logAdminAction(admin, "verify_worker", "worker", profileId);
  revalidatePath("/admin/workers");

  return { success: true, message: "Worker verified." };
}

// ============================================
// TOGGLE WORKER ACTIVE STATUS
// ============================================
export async function toggleWorkerActiveAction(
  profileId: string, isActive: boolean
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized." };

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("worker_profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);

  if (error) return { success: false, error: "Failed to update worker status." };

  await logAdminAction(
    admin,
    isActive ? "activate_worker" : "deactivate_worker",
    "worker", profileId
  );

  revalidatePath("/admin/workers");
  return { success: true, message: `Worker ${isActive ? "activated" : "deactivated"}.` };
}

// ============================================
// FLAG / UNFLAG REVIEW
// ============================================
export async function flagReviewAction(
  reviewId: string, flagged: boolean
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Unauthorized." };

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("reviews")
    .update({ is_flagged: flagged })
    .eq("id", reviewId);

  if (error) return { success: false, error: "Failed to update review." };

  await logAdminAction(
    admin,
    flagged ? "flag_review" : "unflag_review",
    "review", reviewId
  );

  revalidatePath("/admin/reviews");
  return { success: true };
}

// ============================================
// GET ADMIN WORKERS
// ============================================
export async function getAdminWorkersAction(page = 1, search = "") {
  const admin = await requireAdmin();
  if (!admin) return { workers: [], total: 0 };

  const adminSupabase = createAdminClient();
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  let query = adminSupabase
    .from("worker_profiles")
    .select(`
      id, title, district, avg_rating, total_reviews,
      is_active, is_verified, created_at,
      user:users!worker_profiles_user_id_fkey(
        id, full_name, email, is_banned
      ),
      category:categories!worker_profiles_category_id_fkey(name)
    `, { count: "exact" });

  if (search) {
    query = query.or(`title.ilike.%${search}%,district.ilike.%${search}%`);
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  return { workers: data ?? [], total: count ?? 0 };
}

// ============================================
// GET ADMIN PAYMENTS
// ============================================
export async function getAdminPaymentsAction(page = 1) {
  const admin = await requireAdmin();
  if (!admin) return { payments: [], total: 0 };

  const adminSupabase = createAdminClient();
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const { data, count } = await adminSupabase
    .from("payments")
    .select(`
      id, amount, currency, status, payment_type,
      payhere_order_id, verified_at, created_at,
      user:users!payments_user_id_fkey(full_name, email)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  return { payments: data ?? [], total: count ?? 0 };
}