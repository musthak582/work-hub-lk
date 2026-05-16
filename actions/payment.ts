"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateOrderId,
  buildPayHereFields,
  PAYHERE_CONFIG,
} from "@/lib/payhere";
import type { ActionResult } from "@/types/actions";
import type { PayHereFormFields } from "@/lib/payhere";

// ============================================
// INITIATE WORKER REGISTRATION PAYMENT
// ============================================
export async function initiateWorkerPaymentAction(): Promise<
  ActionResult<{
    fields: PayHereFormFields;
    checkoutUrl: string;
    orderId: string;
  }>
> {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // 1. Auth check
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { success: false, error: "Not authenticated." };
  }

  // 2. Fetch user record
  const { data: user } = await adminSupabase
    .from("users")
    .select("id, email, full_name, phone, role")
    .eq("auth_id", authUser.id)
    .single();

  if (!user) return { success: false, error: "User not found." };
  if (user.role !== "worker") {
    return { success: false, error: "Only workers can make this payment." };
  }

  // 3. Check already paid
  const { data: existingPayment } = await adminSupabase
    .from("payments")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("payment_type", "worker_registration")
    .eq("status", "completed")
    .single();

  if (existingPayment) {
    return {
      success: false,
      error: "You have already completed the registration payment.",
    };
  }

  // 4. Generate unique order ID
  const orderId = generateOrderId("WORKER", user.id);

  // 5. Insert pending payment record BEFORE redirecting
  const { error: paymentErr } = await adminSupabase
    .from("payments")
    .insert({
      user_id: user.id,
      payment_type: "worker_registration",
      amount: 1000.00,
      currency: "LKR",
      status: "pending",
      payhere_order_id: orderId,
      metadata: { initiated_at: new Date().toISOString() },
    });

  if (paymentErr) {
    console.error("[Payment] Insert error:", paymentErr);
    return { success: false, error: "Failed to initiate payment. Please try again." };
  }

  // 6. Build PayHere form fields with MD5 hash
  const nameParts = user.full_name.trim().split(" ");
  const firstName = nameParts[0] ?? "User";
  const lastName = nameParts.slice(1).join(" ") || "N/A";

  const fields = buildPayHereFields({
    orderId,
    amount: 1000,
    itemName: "WorkHub LK — Worker Registration",
    firstName,
    lastName,
    email: user.email,
    phone: user.phone,
  });

  // TEMPORARY — remove after debugging
  console.log("PayHere fields being sent:", {
    merchant_id: fields.merchant_id,
    order_id: fields.order_id,
    amount: fields.amount,
    currency: fields.currency,
    hash: fields.hash,
  });

  return {
    success: true,
    data: {
      fields,
      checkoutUrl: PAYHERE_CONFIG.checkoutUrl,
      orderId,
    },
  };
}

// ============================================
// INITIATE CHAT UNLOCK PAYMENT
// ============================================
export async function initiateChatPaymentAction(
  targetWorkerProfileId: string
): Promise<
  ActionResult<{
    fields: PayHereFormFields;
    checkoutUrl: string;
    orderId: string;
  }>
> {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { success: false, error: "Not authenticated." };

  const { data: user } = await adminSupabase
    .from("users")
    .select("id, email, full_name, phone, role")
    .eq("auth_id", authUser.id)
    .single();

  if (!user) return { success: false, error: "User not found." };
  if (user.role !== "hirer") {
    return { success: false, error: "Only hirers can unlock chats." };
  }

  // Get worker profile + user_id
  const { data: workerProfile } = await adminSupabase
    .from("worker_profiles")
    .select("id, user_id, title")
    .eq("id", targetWorkerProfileId)
    .single();

  if (!workerProfile) {
    return { success: false, error: "Worker not found." };
  }

  // Check chat already exists
  const { data: existingChat } = await adminSupabase
    .from("chats")
    .select("id")
    .eq("hirer_id", user.id)
    .eq("worker_id", workerProfile.user_id)
    .single();

  if (existingChat) {
    return { success: false, error: "Chat already unlocked." };
  }

  // Generate order ID + create pending payment
  const orderId = generateOrderId("CHAT", user.id);

  const { error: paymentErr } = await adminSupabase
    .from("payments")
    .insert({
      user_id: user.id,
      payment_type: "chat_unlock",
      amount: 1000.00,
      currency: "LKR",
      status: "pending",
      payhere_order_id: orderId,
      metadata: {
        target_worker_profile_id: targetWorkerProfileId,
        target_worker_user_id: workerProfile.user_id,
        initiated_at: new Date().toISOString(),
      },
    });

  if (paymentErr) {
    return { success: false, error: "Failed to initiate payment." };
  }

  const nameParts = user.full_name.trim().split(" ");

  const fields = buildPayHereFields({
    orderId,
    amount: 1000,
    itemName: `WorkHub LK — Chat Unlock`,
    firstName: nameParts[0] ?? "User",
    lastName: nameParts.slice(1).join(" ") || "N/A",
    email: user.email,
    phone: user.phone,
  });

  return {
    success: true,
    data: {
      fields,
      checkoutUrl: PAYHERE_CONFIG.checkoutUrl,
      orderId,
    },
  };
}

// ============================================
// CHECK PAYMENT STATUS
// Polled by /payment/success page
// ============================================
export async function checkPaymentStatusAction(
  orderId: string
): Promise<ActionResult<{ status: string; redirect?: string }>> {
  const adminSupabase = createAdminClient();

  const { data: payment } = await adminSupabase
    .from("payments")
    .select("id, status, payment_type, metadata, user_id")
    .eq("payhere_order_id", orderId)
    .single();

  if (!payment) {
    return { success: false, error: "Payment not found." };
  }

  let redirect: string | undefined;

  if (payment.status === "completed") {
    if (payment.payment_type === "worker_registration") {
      redirect = "/profile/create";
    } else if (payment.payment_type === "chat_unlock") {
      // Find the chat that was created by webhook
      const meta = payment.metadata as {
        target_worker_profile_id?: string;
        target_worker_user_id?: string;
      };

      const { data: chat } = await adminSupabase
        .from("chats")
        .select("id")
        .eq("hirer_id", payment.user_id)
        .eq("worker_id", meta.target_worker_user_id ?? "")
        .single();

      redirect = chat
        ? `/dashboard/chats/${chat.id}`
        : "/dashboard/chats";
    }
  }

  return {
    success: true,
    data: { status: payment.status, redirect },
  };
}