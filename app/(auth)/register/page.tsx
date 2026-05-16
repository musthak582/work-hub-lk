"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Zap, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { registerAction } from "@/actions/auth";
import { registerSchema, type RegisterInput } from "@/schemas/auth";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters",   ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number",           ok: /[0-9]/.test(password) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="grid grid-cols-2 gap-1.5 mt-2">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5">
          {c.ok
            ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
            : <XCircle className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
          }
          <span className={`text-xs ${c.ok ? "text-green-600" : "text-muted-foreground/60"}`}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition]  = useTransition();
  const router = useRouter();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "", email: "", phone: "", password: "", confirm_password: "",
    },
  });

  const password = form.watch("password");

  function onSubmit(values: RegisterInput) {
    startTransition(async () => {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v));

      const result = await registerAction(fd);

      if (!result.success) {
        toast.error(result.error);
        if (result.field) {
          form.setError(result.field as keyof RegisterInput, {
            message: result.error,
          });
        }
        return;
      }

      toast.success(result.message ?? "Account created!");
      // Pass phone to OTP page via query param
      const phone = encodeURIComponent(result.data!.phone);
      router.push(`/verify-otp?phone=${phone}`);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border/60 rounded-2xl shadow-soft-md p-8"
    >
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-soft">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">
            Work<span className="text-primary">Hub</span>
            <span className="text-muted-foreground text-sm font-normal">LK</span>
          </span>
        </Link>
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1.5">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join WorkHub LK — free to sign up
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Full name */}
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            placeholder="Saman Perera"
            autoComplete="name"
            {...form.register("full_name")}
            className={form.formState.errors.full_name ? "border-destructive" : ""}
          />
          {form.formState.errors.full_name && (
            <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...form.register("email")}
            className={form.formState.errors.email ? "border-destructive" : ""}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0771234567"
            autoComplete="tel"
            {...form.register("phone")}
            className={form.formState.errors.phone ? "border-destructive" : ""}
          />
          {form.formState.errors.phone ? (
            <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Sri Lankan number (07X or +94X)</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="Create a strong password"
              autoComplete="new-password"
              {...form.register("password")}
              className={`pr-10 ${form.formState.errors.password ? "border-destructive" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              autoComplete="new-password"
              {...form.register("confirm_password")}
              className={`pr-10 ${form.formState.errors.confirm_password ? "border-destructive" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.formState.errors.confirm_password && (
            <p className="text-xs text-destructive">{form.formState.errors.confirm_password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          disabled={isPending}
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</>
          ) : (
            "Create account"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-5">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}