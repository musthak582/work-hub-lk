import { createAdminClient } from "@/lib/supabase/server";
import { AdminReviewsClient } from "@/components/admin/admin-reviews-client";

export const metadata = { title: "Reviews — Admin" };

export default async function AdminReviewsPage() {
  const adminSupabase = createAdminClient();

  const { data: reviews } = await adminSupabase
    .from("reviews")
    .select(`
      id, rating, comment, is_flagged, created_at,
      hirer:users!reviews_hirer_id_fkey(full_name, email),
      worker_profile:worker_profiles!reviews_worker_id_fkey(
        title,
        user:users!worker_profiles_user_id_fkey(full_name)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return <AdminReviewsClient reviews={reviews ?? []} />;
}