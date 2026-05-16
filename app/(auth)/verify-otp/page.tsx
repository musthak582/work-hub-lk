"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Loader2, RefreshCw, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { verifyOtpAction } from "@/actions/otp";
import { resendOtpAction } from "@/actions/auth";

const OTP_LENGTH = 6;

export default function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const router = useRouter();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isPending, startTransition] = useTransition();
  const [resendCooldown, setResendCooldown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  function handleChange(i: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);

    if (digit && i < OTP_LENGTH - 1) {
      inputRefs.current[i + 1]?.focus();
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = [...otp];
    digits.split("").forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleVerify() {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      toast.error("Please enter all 6 digits");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("phone", phone);
      fd.append("code", code);

      const result = await verifyOtpAction(fd);

      if (!result.success) {
        toast.error(result.error);
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      toast.success("Phone verified!");
      router.push("/select-role");
    });
  }

  function handleResend() {
    if (!canResend) return;
    startTransition(async () => {
      const result = await resendOtpAction(phone);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("New OTP sent!");
      setOtp(Array(OTP_LENGTH).fill(""));
      setResendCooldown(30);
      setCanResend(false);
      inputRefs.current[0]?.focus();
    });
  }

  const maskedPhone = phone
    ? phone.replace(/(\+94|0)(\d{2})(\d{3})(\d{4})/, "$1$2***$4")
    : "your phone";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border/60 rounded-2xl shadow-soft-md p-8 text-center"
    >
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-soft">
            <Zap className="w-5 h-5 text-white" />
          </div>
        </Link>
      </div>

      {/* Icon */}
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Phone className="w-7 h-7 text-primary" />
      </div>

      <h1 className="text-2xl font-display font-bold text-foreground mb-2">
        Verify your phone
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-foreground">{maskedPhone}</span>
      </p>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-3 text-sm text-primary font-medium">
          Demo OTP: 123456
        </div>
      )}

      {/* OTP inputs */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background outline-none transition-all duration-150 ${digit
                ? "border-primary text-foreground"
                : "border-border text-muted-foreground"
              } focus:border-primary focus:ring-2 focus:ring-primary/20`}
          />
        ))}
      </div>

      <Button
        onClick={handleVerify}
        className="w-full"
        size="lg"
        disabled={isPending || otp.join("").length !== OTP_LENGTH}
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</>
        ) : (
          "Verify phone number"
        )}
      </Button>

      {/* Resend */}
      <div className="mt-6">
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={isPending}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Resend OTP
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Resend code in{" "}
            <span className="font-medium text-foreground">{resendCooldown}s</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}