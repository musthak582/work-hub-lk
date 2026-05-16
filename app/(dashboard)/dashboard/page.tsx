import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkerDashboard } from "@/components/dashboard/worker-dashboard";
import { HirerDashboard } from "@/components/dashboard/hirer-dashboard";

export const metadata = { title: "Dashboard — WorkHub LK" };

export default async function DashboardPage() {
  const user = await requireAuth();
  const adminSupabase = createAdminClient();

  if (user.role === "worker") {
    // First fetch profile
    const { data: profile } = await adminSupabase
      .from("worker_profiles")
      .select(`
      id,
      title,
      avg_rating,
      total_reviews,
      availability,
      is_active,
      is_verified,
      district,
      category:categories(name)
    `)
      .eq("user_id", user.id)
      .single();

    // Then fetch remaining data
    const [
      { data: payments },
      { data: chats },
      { data: reviews },
    ] = await Promise.all([
      adminSupabase
        .from("payments")
        .select("id, status, payment_type, created_at")
        .eq("user_id", user.id)
        .eq("payment_type", "worker_registration")
        .order("created_at", { ascending: false })
        .limit(1),

      adminSupabase
        .from("chats")
        .select("id")
        .eq("worker_id", user.id),

      adminSupabase
        .from("reviews")
        .select("rating")
        .eq(
          "worker_id",
          profile?.id ?? "00000000-0000-0000-0000-000000000000"
        ),
    ]);

    const hasPaid = payments?.[0]?.status === "completed";

    return (
      <WorkerDashboard
        user={user}
        profile={profile ?? null}
        hasPaid={hasPaid}
        totalChats={chats?.length ?? 0}
        totalReviews={reviews?.length ?? 0}
        recentReviews={reviews ?? []}
      />
    );
  }

  if (user.role === "hirer") {
    const [
      chatsResult,
      paymentsResult,
    ] = await Promise.all([
      // FIX: count requires selecting from the table directly
      // The joined select with count: "exact" sometimes misreports
      adminSupabase
        .from("chats")
        .select(`
        id, created_at, is_active, updated_at,
        worker:users!chats_worker_id_fkey(id, full_name, avatar_url),
        worker_profile:worker_profiles!inner(
          id, title, profile_image_url,
          category:categories(name)
        )
      `)
        .eq("hirer_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),

      adminSupabase
        .from("payments")
        .select("id, amount, status, payment_type, created_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Separate count query — reliable every time
    const { count: totalChats } = await adminSupabase
      .from("chats")
      .select("id", { count: "exact", head: true })
      .eq("hirer_id", user.id)
      .eq("is_active", true);

    const chats = chatsResult.data ?? [];
    const payments = paymentsResult.data ?? [];

    return (
      <HirerDashboard
        user={user}
        recentChats={chats.slice(0, 5)}
        totalChats={totalChats ?? 0}        // ← now always a real number
        recentPayments={payments}
      />
    );
  }

  redirect("/select-role");
}