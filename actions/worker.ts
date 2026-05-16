"use server";

import { revalidatePath }    from "next/cache";
import { createClient }      from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { uploadImage }       from "@/lib/cloudinary";
import { workerProfileSchema } from "@/schemas/worker";
import type { ActionResult }   from "@/types/actions";
import type { WorkerProfile }  from "@/types/database";

// ============================================
// CREATE WORKER PROFILE
// Only allowed after payment is verified
// ============================================
export async function createWorkerProfileAction(
  formData: FormData
): Promise<ActionResult<{ profileId: string }>> {
  const supabase      = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Auth check
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { success: false, error: "Not authenticated." };

  // 2. Fetch user
  const { data: user } = await adminSupabase
    .from("users")
    .select("id, role, full_name")
    .eq("auth_id", authUser.id)
    .single();

  if (!user) return { success: false, error: "User not found." };
  if (user.role !== "worker") {
    return { success: false, error: "Only workers can create profiles." };
  }

  // 3. Verify payment completed
  const { data: payment } = await adminSupabase
    .from("payments")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("payment_type", "worker_registration")
    .eq("status", "completed")
    .single();

  if (!payment) {
    return {
      success: false,
      error:   "Payment required. Please complete the registration payment first.",
    };
  }

  // 4. Check no existing profile
  const { data: existingProfile } = await adminSupabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingProfile) {
    return {
      success: false,
      error:   "You already have a worker profile.",
    };
  }

  // 5. Parse + validate form data
  const raw = {
    title:             formData.get("title"),
    category_id:       formData.get("category_id"),
    description:       formData.get("description"),
    experience_years:  Number(formData.get("experience_years") ?? 0),
    district:          formData.get("district"),
    starting_price:    formData.get("starting_price")
      ? Number(formData.get("starting_price"))
      : null,
    availability:      formData.get("availability") ?? "available",
    profile_image_url: formData.get("profile_image_url") ?? null,
  };

  const parsed = workerProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      success: false,
      error:   first.message,
      field:   first.path[0] as string,
    };
  }

  const data = parsed.data;

  // 6. Handle profile image upload if base64 provided
  let profileImageUrl = data.profile_image_url ?? null;
  const imageBase64   = formData.get("profile_image_base64") as string | null;

  if (imageBase64 && imageBase64.startsWith("data:image/")) {
    const uploaded = await uploadImage(imageBase64, {
      folder:    "profiles",
      publicId:  `profile_${user.id}`,
      maxWidth:  400,
      maxHeight: 400,
      quality:   85,
    });

    if (uploaded) {
      profileImageUrl = uploaded.url;
      // Update user avatar too
      await adminSupabase
        .from("users")
        .update({ avatar_url: uploaded.url })
        .eq("id", user.id);
    }
  }

  // 7. Create worker profile
  const { data: profile, error: profileErr } = await adminSupabase
    .from("worker_profiles")
    .insert({
      user_id:           user.id,
      category_id:       data.category_id,
      title:             data.title,
      description:       data.description,
      experience_years:  data.experience_years,
      district:          data.district,
      starting_price:    data.starting_price ?? null,
      availability:      data.availability,
      profile_image_url: profileImageUrl,
      is_active:         true,
      is_verified:       false,
    })
    .select("id")
    .single();

  if (profileErr || !profile) {
    console.error("[Worker] Profile create error:", profileErr);
    return { success: false, error: "Failed to create profile. Please try again." };
  }

  // 8. Handle portfolio images
  const portfolioImages: string[] = [];
  for (let i = 0; i < 5; i++) {
    const imgData = formData.get(`portfolio_image_${i}`) as string | null;
    if (imgData && imgData.startsWith("data:image/")) {
      portfolioImages.push(imgData);
    }
  }

  if (portfolioImages.length > 0) {
    const uploadPromises = portfolioImages.map((img, i) =>
      uploadImage(img, {
        folder:   "portfolio",
        publicId: `portfolio_${profile.id}_${i}`,
        maxWidth: 1200,
      })
    );

    const results = await Promise.allSettled(uploadPromises);
    const uploads = results
      .filter(
        (r): r is PromiseFulfilledResult<{ url: string; publicId: string } | null> =>
          r.status === "fulfilled" && r.value !== null
      )
      .map((r, i) => ({
        worker_id:  profile.id,
        image_url:  r.value!.url,
        sort_order: i,
      }));

    if (uploads.length > 0) {
      await adminSupabase.from("worker_portfolio").insert(uploads);
    }
  }

  revalidatePath("/workers");
  revalidatePath("/dashboard");

  return {
    success: true,
    data:    { profileId: profile.id },
    message: "Profile created successfully! You're now live.",
  };
}

// ============================================
// UPDATE WORKER PROFILE
// ============================================
export async function updateWorkerProfileAction(
  profileId: string,
  formData:  FormData
): Promise<ActionResult> {
  const supabase      = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { success: false, error: "Not authenticated." };

  const { data: user } = await adminSupabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  if (!user) return { success: false, error: "User not found." };

  // Verify profile belongs to user
  const { data: profile } = await adminSupabase
    .from("worker_profiles")
    .select("id, user_id, profile_image_url")
    .eq("id",      profileId)
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "Profile not found." };
  }

  const raw = {
    title:            formData.get("title"),
    description:      formData.get("description"),
    experience_years: Number(formData.get("experience_years") ?? 0),
    district:         formData.get("district"),
    starting_price:   formData.get("starting_price")
      ? Number(formData.get("starting_price"))
      : null,
    availability:     formData.get("availability") ?? "available",
  };

  const parsed = workerProfileSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  // Handle new profile image
  let profileImageUrl = profile.profile_image_url;
  const imageBase64   = formData.get("profile_image_base64") as string | null;

  if (imageBase64 && imageBase64.startsWith("data:image/")) {
    const uploaded = await uploadImage(imageBase64, {
      folder:   "profiles",
      publicId: `profile_${user.id}`,
      maxWidth:  400,
      maxHeight: 400,
    });
    if (uploaded) {
      profileImageUrl = uploaded.url;
      await adminSupabase
        .from("users")
        .update({ avatar_url: uploaded.url })
        .eq("id", user.id);
    }
  }

  const { error: updateErr } = await adminSupabase
    .from("worker_profiles")
    .update({
      ...parsed.data,
      profile_image_url: profileImageUrl,
      updated_at:        new Date().toISOString(),
    })
    .eq("id", profileId);

  if (updateErr) {
    return { success: false, error: "Failed to update profile." };
  }

  revalidatePath(`/workers/${profileId}`);
  revalidatePath("/dashboard");

  return { success: true, message: "Profile updated successfully!" };
}

// ============================================
// GET SIGNED CLOUDINARY PARAMS (for client upload)
// ============================================
export async function getCloudinarySignatureAction(
  folder: string
): Promise<ActionResult<{
  signature:  string;
  timestamp:  number;
  apiKey:     string;
  cloudName:  string;
  folder:     string;
}>> {
  const { generateSignedUploadParams } = await import("@/lib/cloudinary");
  const params = generateSignedUploadParams(folder);
  return { success: true, data: params };
}