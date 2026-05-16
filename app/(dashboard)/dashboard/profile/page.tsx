import { redirect }      from "next/navigation";
import { requireAuth }   from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkerProfileEditForm } from "@/components/workers/worker-profile-edit-form";

export const metadata = { title: "My Profile — WorkHub LK" };

export default async function ProfilePage() {
  const user          = await requireAuth();
  const adminSupabase = createAdminClient();

  if (user.role !== "worker") redirect("/dashboard");

  const { data: profile } = await adminSupabase
    .from("worker_profiles")
    .select(`
      id, title, description, district, experience_years,
      starting_price, availability, profile_image_url,
      is_active, is_verified, avg_rating, total_reviews,
      category_id,
      category:categories(id, name, slug),
      portfolio:worker_portfolio(id, image_url, caption, sort_order)
    `)
    .eq("user_id", user.id)
    .single();

  const { data: categories } = await adminSupabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order");

  if (!profile) redirect("/profile/create");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          My profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Keep your profile updated to attract more hirers.
        </p>
      </div>
      <WorkerProfileEditForm
        profile={profile}
        categories={categories ?? []}
      />
    </div>
  );
}