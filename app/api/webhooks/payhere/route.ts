import { NextRequest, NextResponse } from "next/server";
import { createAdminClient }         from "@/lib/supabase/server";
import {
  verifyPayHereNotification,
  isPaymentSuccessful,
} from "@/lib/payhere";

// PayHere sends POST with application/x-www-form-urlencoded
export async function POST(request: NextRequest) {
  try {
    // 1. Parse form body
    const body   = await request.formData();
    const params = Object.fromEntries(body.entries()) as Record<string, string>;

    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      payment_id,
    } = params;

    // 2. Validate required fields
    if (
      !merchant_id || !order_id || !payhere_amount ||
      !payhere_currency || !status_code || !md5sig
    ) {
      console.error("[Webhook] Missing required PayHere fields:", params);
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3. Verify the MD5 signature — CRITICAL SECURITY STEP
    const isValid = verifyPayHereNotification({
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    });

    if (!isValid) {
      console.error("[Webhook] Invalid MD5 signature for order:", order_id);
      // Return 200 so PayHere doesn't retry (it's a fraud attempt)
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const adminSupabase = createAdminClient();

    // 4. Fetch our payment record
    const { data: payment, error: fetchErr } = await adminSupabase
      .from("payments")
      .select("*")
      .eq("payhere_order_id", order_id)
      .single();

    if (fetchErr || !payment) {
      console.error("[Webhook] Payment record not found for order:", order_id);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 5. Idempotency — skip if already processed
    if (payment.status === "completed" || payment.status === "failed") {
      console.log("[Webhook] Already processed:", order_id);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 6. Determine new status
    const success  = isPaymentSuccessful(status_code);
    const newStatus = success ? "completed" : "failed";

    // 7. Update payment record
    const { error: updateErr } = await adminSupabase
      .from("payments")
      .update({
        status:              newStatus,
        payhere_payment_id:  payment_id ?? null,
        payhere_md5_hash:    md5sig,
        verified_at:         success ? new Date().toISOString() : null,
      })
      .eq("id", payment.id);

    if (updateErr) {
      console.error("[Webhook] Payment update error:", updateErr);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    // 8. Post-payment actions (only on success)
    if (success) {
      if (payment.payment_type === "chat_unlock") {
        const meta = payment.metadata as {
          target_worker_profile_id?: string;
          target_worker_user_id?: string;
        };

        if (meta?.target_worker_user_id) {
          // Create chat room
          const { error: chatErr } = await adminSupabase
            .from("chats")
            .insert({
              hirer_id:   payment.user_id,
              worker_id:  meta.target_worker_user_id,
              payment_id: payment.id,
              is_active:  true,
            });

          if (chatErr && chatErr.code !== "23505") {
            // 23505 = unique violation (already exists) — safe to ignore
            console.error("[Webhook] Chat creation error:", chatErr);
          }
        }
      }

      // worker_registration: no extra action needed — user goes to /profile/create
    }

    console.log(`[Webhook] Processed order ${order_id} → ${newStatus}`);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("[Webhook] Unhandled error:", err);
    // Always return 200 so PayHere doesn't keep retrying
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// PayHere sometimes sends GET to verify the URL exists
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}