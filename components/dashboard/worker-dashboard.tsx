"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star, MessageCircle, Eye, AlertCircle,
  CheckCircle2, ArrowRight, Zap, TrendingUp,
  User, Edit3,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge }    from "@/components/ui/badge";
import { cn }       from "@/lib/utils";
import type { AuthUser } from "@/types/actions";

interface WorkerDashboardProps {
  user:          AuthUser;
  profile:       any | null;
  hasPaid:       boolean;
  totalChats:    number;
  totalReviews:  number;
  recentReviews: { rating: number }[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

export function WorkerDashboard({
  user, profile, hasPaid, totalChats, totalReviews, recentReviews,
}: WorkerDashboardProps) {
  const avgRating = recentReviews.length
    ? recentReviews.reduce((s, r) => s + r.rating, 0) / recentReviews.length
    : 0;

  // ── STEP 1: Not paid yet ──────────────────
  if (!hasPaid) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border/60 rounded-2xl shadow-soft p-10"
        >
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Zap className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Activate your profile
          </h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Pay the one-time LKR 1,000 registration fee to create your
            worker profile and start getting hired.
          </p>
          <Button size="lg" className="w-full" asChild>
            <Link href="/payment/worker">
              <Zap className="w-4 h-4 mr-2" />
              Activate now — LKR 1,000
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── STEP 2: Paid but no profile yet ──────
  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border/60 rounded-2xl shadow-soft p-10"
        >
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Payment confirmed!
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Now create your worker profile so hirers can discover you.
          </p>
          <Button size="lg" className="w-full" asChild>
            <Link href="/profile/create">
              <User className="w-4 h-4 mr-2" />
              Create my profile
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── STEP 3: Full dashboard ────────────────
  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        custom={0} variants={fadeUp} initial="hidden" animate="show"
        className="flex items-start justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            Welcome back, {user.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's how your profile is performing.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/profile">
            <Edit3 className="w-4 h-4 mr-1.5" />
            Edit profile
          </Link>
        </Button>
      </motion.div>

      {/* Profile status banner */}
      {!profile.is_active && (
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" animate="show"
          className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Profile inactive</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your profile is hidden from search results.
              <Link href="/dashboard/profile" className="underline ml-1">
                Activate it
              </Link>
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <motion.div
        custom={2} variants={fadeUp} initial="hidden" animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Average rating"
          value={avgRating > 0 ? avgRating.toFixed(1) + " ★" : "No ratings"}
          icon={Star}
          iconColor="text-amber-500"
          iconBg="bg-amber-50"
          subtitle={`${totalReviews} review${totalReviews !== 1 ? "s" : ""}`}
        />
        <StatCard
          title="Active chats"
          value={totalChats}
          icon={MessageCircle}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          subtitle="Hirer enquiries"
        />
        <StatCard
          title="Profile status"
          value={profile.is_active ? "Active" : "Inactive"}
          icon={Eye}
          iconColor={profile.is_active ? "text-green-500" : "text-muted-foreground"}
          iconBg={profile.is_active ? "bg-green-50" : "bg-muted"}
          subtitle={profile.is_active ? "Visible in search" : "Hidden from search"}
        />
        <StatCard
          title="Verified"
          value={profile.is_verified ? "Verified ✓" : "Not verified"}
          icon={CheckCircle2}
          iconColor={profile.is_verified ? "text-blue-500" : "text-muted-foreground"}
          iconBg={profile.is_verified ? "bg-blue-50" : "bg-muted"}
          subtitle={profile.is_verified ? "Admin verified" : "Pending verification"}
        />
      </motion.div>

      {/* Profile summary card */}
      <motion.div
        custom={3} variants={fadeUp} initial="hidden" animate="show"
        className="bg-card border border-border/60 rounded-xl shadow-card p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Your profile
          </h2>
          <Link
            href={`/workers/${profile.id}`}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View public <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Title</p>
            <p className="text-sm font-medium text-foreground">{profile.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Category</p>
              <p className="text-sm font-medium">{(profile.category as any)?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">District</p>
              <p className="text-sm font-medium">{profile.district}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Availability</p>
            <div className="flex gap-2">
              {(["available", "busy", "unavailable"] as const).map((a) => (
                <span
                  key={a}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border font-medium capitalize",
                    profile.availability === a
                      ? a === "available"
                        ? "bg-green-100 text-green-700 border-green-200"
                        : a === "busy"
                        ? "bg-amber-100 text-amber-700 border-amber-200"
                        : "bg-red-100 text-red-700 border-red-200"
                      : "bg-secondary text-muted-foreground border-border"
                  )}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div
        custom={4} variants={fadeUp} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          {
            label: "View messages",
            desc:  "See all hirer enquiries",
            href:  "/dashboard/chats",
            icon:  MessageCircle,
            color: "text-blue-500",
            bg:    "bg-blue-50",
          },
          {
            label: "See reviews",
            desc:  "Read what hirers say",
            href:  "/dashboard/reviews",
            icon:  Star,
            color: "text-amber-500",
            bg:    "bg-amber-50",
          },
          {
            label: "Edit profile",
            desc:  "Update your information",
            href:  "/dashboard/profile",
            icon:  Edit3,
            color: "text-primary",
            bg:    "bg-primary/10",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-4 p-4 bg-card border border-border/60 rounded-xl hover:border-border hover:shadow-soft transition-all"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", action.bg)}>
                <Icon className={cn("w-5 h-5", action.color)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}