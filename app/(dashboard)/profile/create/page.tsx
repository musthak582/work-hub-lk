import { redirect }          from "next/navigation";
import { requireAuth }       from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/server";
import { ProfileCreateForm } from "@/components/workers/profile-create-form";

export const metadata = { title: "Create Profile — WorkHub LK" };

export default async function CreateProfilePage() {
  const user        = await requireAuth();
  const adminSupabase = createAdminClient();

  if (user.role !== "worker") redirect("/dashboard");

  // Must have paid
  const { data: payment } = await adminSupabase
    .from("payments")
    .select("id")
    .eq("user_id",      user.id)
    .eq("payment_type", "worker_registration")
    .eq("status",       "completed")
    .single();

  if (!payment) redirect("/payment/worker");

  // Must not have a profile already
  const { data: existingProfile } = await adminSupabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingProfile) redirect("/dashboard");

  // Fetch categories for select
  const { data: categories } = await adminSupabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="min-h-screen bg-secondary/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Create your worker profile
          </h1>
          <p className="text-muted-foreground">
            Your profile is how hirers find and evaluate you.
            Make it count.
          </p>
        </div>
        <ProfileCreateForm
          categories={categories ?? []}
          userId={user.id}
        />
      </div>
    </div>
  );
}