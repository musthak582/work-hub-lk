"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { loginAction } from "@/actions/auth";
import { loginSchema, type LoginInput } from "@/schemas/auth";

export default function LoginPage() {
  const [showPass, setShowPass]   = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginInput) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("email",    values.email);
      fd.append("password", values.password);

      const result = await loginAction(fd);

      if (!result.success) {
        toast.error(result.error);
        if (result.field) {
          form.setError(result.field as keyof LoginInput, {
            message: result.error,
          });
        }
        return;
      }

      toast.success("Welcome back!");
      router.push(result.data!.redirect_to);
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
      <div className="flex justify-center mb-8">
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

      <div className="mb-8 text-center">
        <h1 className="text-2xl font-display font-bold text-foreground mb-1.5">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your WorkHub LK account
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="Your password"
              autoComplete="current-password"
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
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isPending}
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Create one free
        </Link>
      </p>
    </motion.div>
  );
}