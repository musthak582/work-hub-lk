"use server";

import { revalidatePath }    from "next/cache";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { submitReviewSchema } from "@/schemas/review";
import type { ActionResult }  from "@/types/actions";

// ============================================
// SUBMIT REVIEW
// ============================================
export async function submitReviewAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    worker_id: formData.get("worker_id"),
    chat_id:   formData.get("chat_id"),
    rating:    Number(formData.get("rating")),
    comment:   formData.get("comment") || null,
  };

  const parsed = submitReviewSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error:   parsed.error.errors[0].message,
    };
  }

  const { worker_id, chat_id, rating, comment } = parsed.data;

  const supabase      = await createClient();
  const adminSupabase = createAdminClient();

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { success: false, error: "Not authenticated." };

  const { data: user } = await adminSupabase
    .from("users")
    .select("id, role")
    .eq("auth_id", authUser.id)
    .single();

  if (!user)               return { success: false, error: "User not found."          };
  if (user.role !== "hirer") return { success: false, error: "Only hirers can review." };

  // Verify the hirer has an active chat with this worker
  const { data: chat } = await adminSupabase
    .from("chats")
    .select("id, hirer_id, worker_id")
    .eq("id",       chat_id)
    .eq("hirer_id", user.id)
    .single();

  if (!chat) {
    return {
      success: false,
      error:   "You must have an active chat to leave a review.",
    };
  }

  // Check for existing review
  const { data: existing } = await adminSupabase
    .from("reviews")
    .select("id")
    .eq("worker_id", worker_id)
    .eq("hirer_id",  user.id)
    .single();

  if (existing) {
    // Update existing review
    const { error } = await adminSupabase
      .from("reviews")
      .update({ rating, comment: comment ?? null })
      .eq("id", existing.id);

    if (error) return { success: false, error: "Failed to update review." };

    revalidatePath(`/workers/${worker_id}`);
    return { success: true, message: "Review updated successfully!" };
  }

  // Insert new review
  const { error } = await adminSupabase
    .from("reviews")
    .insert({
      worker_id,
      hirer_id:  user.id,
      chat_id,
      rating,
      comment:   comment ?? null,
      is_flagged: false,
    });

  if (error) {
    console.error("[Review] Insert error:", error);
    return { success: false, error: "Failed to submit review." };
  }

  revalidatePath(`/workers/${worker_id}`);
  revalidatePath("/dashboard/reviews");

  return { success: true, message: "Review submitted! Thank you." };
}

// ============================================
// GET WORKER'S REVIEWS (for dashboard)
// ============================================
export async function getMyReviewsAction(): Promise<{
  reviews: any[];
  avgRating: number;
  total: number;
  breakdown: Record<number, number>;
}> {
  const supabase      = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { reviews: [], avgRating: 0, total: 0, breakdown: {} };

  const { data: user } = await adminSupabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (!user) return { reviews: [], avgRating: 0, total: 0, breakdown: {} };

  // Get worker profile id
  const { data: profile } = await adminSupabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { reviews: [], avgRating: 0, total: 0, breakdown: {} };

  const { data: reviews } = await adminSupabase
    .from("reviews")
    .select(`
      id, rating, comment, created_at, is_flagged,
      hirer:users!reviews_hirer_id_fkey(
        id, full_name, avatar_url
      )
    `)
    .eq("worker_id",  profile.id)
    .eq("is_flagged", false)
    .order("created_at", { ascending: false });

  const list   = reviews ?? [];
  const total  = list.length;
  const avgRating = total
    ? list.reduce((s: number, r: any) => s + r.rating, 0) / total
    : 0;

  // Rating breakdown (5→1)
  const breakdown: Record<number, number> = { 5:0, 4:0, 3:0, 2:0, 1:0 };
  list.forEach((r: any) => {
    if (breakdown[r.rating] !== undefined) breakdown[r.rating]++;
  });

  return { reviews: list, avgRating, total, breakdown };
}

// ============================================
// CHECK IF HIRER CAN REVIEW
// ============================================
export async function canReviewWorkerAction(
  workerProfileId: string
): Promise<{
  canReview:        boolean;
  chatId:           string | null;
  existingReview:   any | null;
}> {
  const supabase      = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { canReview: false, chatId: null, existingReview: null };

  const { data: user } = await adminSupabase
    .from("users")
    .select("id, role")
    .eq("auth_id", authUser.id)
    .single();

  if (!user || user.role !== "hirer") {
    return { canReview: false, chatId: null, existingReview: null };
  }

  // Get worker's user_id from profile
  const { data: workerProfile } = await adminSupabase
    .from("worker_profiles")
    .select("user_id")
    .eq("id", workerProfileId)
    .single();

  if (!workerProfile) {
    return { canReview: false, chatId: null, existingReview: null };
  }

  // Check for existing chat
  const { data: chat } = await adminSupabase
    .from("chats")
    .select("id")
    .eq("hirer_id",  user.id)
    .eq("worker_id", workerProfile.user_id)
    .single();

  if (!chat) return { canReview: false, chatId: null, existingReview: null };

  // Check for existing review
  const { data: existing } = await adminSupabase
    .from("reviews")
    .select("id, rating, comment")
    .eq("worker_id", workerProfileId)
    .eq("hirer_id",  user.id)
    .single();

  return {
    canReview:      true,
    chatId:         chat.id,
    existingReview: existing ?? null,
  };
}