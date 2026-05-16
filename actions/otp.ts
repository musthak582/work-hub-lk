"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { createClient }      from "@/lib/supabase/server";
import { verifyOtp, sendOtp } from "@/lib/twilio";
import { verifyOtpSchema }   from "@/schemas/auth";
import type { ActionResult } from "@/types/actions";

// ============================================
// VERIFY OTP
// ============================================
export async function verifyOtpAction(
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    phone: formData.get("phone"),
    code:  formData.get("code"),
  };

  const parsed = verifyOtpSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { success: false, error: first.message, field: first.path[0] as string };
  }

  const { phone, code } = parsed.data;

  // 1. Verify with Twilio
  const twilioResult = await verifyOtp(phone, code);
  if (!twilioResult.success) {
    return { success: false, error: twilioResult.error ?? "Verification failed." };
  }

  // 2. Get current auth user
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  // 3. Mark phone as verified in users table
  const adminSupabase = createAdminClient();
  const { error: updateError } = await adminSupabase
    .from("users")
    .update({ phone_verified: true })
    .eq("auth_id", authUser.id);

  if (updateError) {
    console.error("[OTP] Update phone_verified error:", updateError);
    return { success: false, error: "Verification failed. Please try again." };
  }

  return {
    success: true,
    message: "Phone number verified successfully!",
  };
}

// ============================================
// SEND OTP (standalone — for resend button)
// ============================================
export async function sendOtpAction(phone: string): Promise<ActionResult> {
  if (!phone || phone.trim() === "") {
    return { success: false, error: "Phone number is required." };
  }

  const result = await sendOtp(phone);

  if (!result.success) {
    return { success: false, error: result.error ?? "Failed to send OTP." };
  }

  return {
    success: true,
    message: `OTP sent to ${phone}`,
  };
}