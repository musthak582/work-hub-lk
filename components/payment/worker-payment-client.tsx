"use client";

import { useTransition } from "react";
import { motion }        from "framer-motion";
import {
  Shield, CheckCircle2, Zap,
  CreditCard, Loader2, Lock,
} from "lucide-react";
import { toast }   from "sonner";
import { Button }  from "@/components/ui/button";
import { initiateWorkerPaymentAction } from "@/actions/payment";
import type { AuthUser } from "@/types/actions";

const BENEFITS = [
  "Appear in search results immediately",
  "Receive direct enquiries from hirers",
  "One-time fee — no monthly charges",
  "Professional profile with portfolio",
  "Reviews and rating system",
  "District-based visibility",
];

// PayHere sandbox test cards:
// Visa:       4916217501611292  CVV: 100  Exp: any future
// MasterCard: 5307732125531191  CVV: 100  Exp: any future

interface WorkerPaymentClientProps {
  user: AuthUser;
}

export function WorkerPaymentClient({ user }: WorkerPaymentClientProps) {
  const [isPending, startTransition] = useTransition();

  // ============================================
  // SUBMIT REAL PAYHERE FORM
  // Creates a hidden <form> and submits it to
  // PayHere checkout — standard PayHere integration
  // ============================================
  function handlePayment() {
    startTransition(async () => {
      const result = await initiateWorkerPaymentAction();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const { fields, checkoutUrl } = result.data!;

      // Build hidden form and submit to PayHere
      const form       = document.createElement("form");
      form.method      = "POST";
      form.action      = checkoutUrl;
      form.style.display = "none";

      // Append all PayHere fields as hidden inputs
      Object.entries(fields).forEach(([key, value]) => {
        const input   = document.createElement("input");
        input.type    = "hidden";
        input.name    = key;
        input.value   = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    });
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Activate your worker profile
          </h1>
          <p className="text-muted-foreground text-sm">
            One-time fee to get discovered by thousands of hirers
          </p>
        </div>

        {/* Pricing card */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-soft-md overflow-hidden mb-5">

          {/* Price header */}
          <div className="bg-foreground text-background px-8 py-6 text-center">
            <p className="text-sm text-background/60 mb-1">
              One-time registration fee
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-sm text-background/60">LKR</span>
              <span className="text-5xl font-display font-bold">1,000</span>
            </div>
            <p className="text-xs text-background/40 mt-2">
              Paid securely via PayHere · No recurring charges
            </p>
          </div>

          {/* Benefits */}
          <div className="px-8 py-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              What you get
            </p>
            <ul className="space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pay button */}
          <div className="px-8 pb-8 space-y-4">
            <Button
              onClick={handlePayment}
              disabled={isPending}
              size="lg"
              className="w-full shadow-soft text-base"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing payment…
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay LKR 1,000 via PayHere
                </>
              )}
            </Button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-5 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="w-3 h-3" />
                256-bit SSL
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                Secured by PayHere
              </div>
            </div>
          </div>
        </div>

        {/* Sandbox notice — only shown when in sandbox mode */}
        {process.env.NEXT_PUBLIC_PAYHERE_MODE === "sandbox" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-amber-700 mb-2">
              🧪 Sandbox mode — use test cards
            </p>
            <div className="space-y-1 font-mono text-xs text-amber-600">
              <p>Visa:       4916217501611292</p>
              <p>MasterCard: 5307732125531191</p>
              <p>CVV: 100 · Expiry: any future date</p>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground">
          This is a non-refundable activation fee. By paying, you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>
          .
        </p>
      </motion.div>
    </div>
  );
}