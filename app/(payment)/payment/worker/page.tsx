import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth }       from "@/lib/session";
import { WorkerPaymentClient } from "@/components/payment/worker-payment-client";

export const metadata = {
  title: "Complete Registration — WorkHub LK",
};

export default async function WorkerPaymentPage() {
  const user = await requireAuth();

  // If they already paid and have a profile, go to dashboard
  const adminSupabase = createAdminClient();

  const { data: existingProfile } = await adminSupabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingProfile) redirect("/dashboard");

  // Check if payment already completed (profile not created yet)
  const { data: completedPayment } = await adminSupabase
    .from("payments")
    .select("id")
    .eq("user_id",      user.id)
    .eq("payment_type", "worker_registration")
    .eq("status",       "completed")
    .single();

  if (completedPayment) redirect("/profile/create");

  return <WorkerPaymentClient user={user} />;
}