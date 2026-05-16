"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { checkPaymentStatusAction } from "@/actions/payment";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderId      = searchParams.get("order_id");
  const router       = useRouter();
  const [status, setStatus] = useState<"checking" | "success" | "pending">("checking");

  useEffect(() => {
    if (!orderId) { router.push("/dashboard"); return; }

    // Poll for up to 30s (webhook may take a moment)
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      attempts++;
      const result = await checkPaymentStatusAction(orderId);

      if (result.success && result.data?.status === "completed") {
        setStatus("success");
        setTimeout(() => router.push(result.data!.redirect ?? "/dashboard"), 2000);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 3000);
      } else {
        setStatus("pending");
        setTimeout(() => router.push("/dashboard"), 3000);
      }
    };

    poll();
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border/60 rounded-2xl shadow-soft-md p-12 text-center max-w-md w-full"
      >
        {status === "checking" && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold mb-2">Confirming payment…</h2>
            <p className="text-sm text-muted-foreground">Please wait while we verify your payment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold mb-2">Payment confirmed!</h2>
            <p className="text-sm text-muted-foreground">Redirecting you now…</p>
          </>
        )}
        {status === "pending" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-display font-bold mb-2">Payment received</h2>
            <p className="text-sm text-muted-foreground">
              We'll activate your account shortly. Redirecting to dashboard…
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}