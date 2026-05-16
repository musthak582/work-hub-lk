"use client";

import { motion } from "framer-motion";
import {
  Users, Briefcase, CreditCard, MessageCircle,
  Star, TrendingUp, ShieldOff, Clock,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

interface AdminOverviewProps {
  stats: {
    totalUsers:      number;
    totalWorkers:    number;
    totalHirers:     number;
    totalPayments:   number;
    pendingPayments: number;
    totalChats:      number;
    totalReviews:    number;
    totalRevenue:    number;
    bannedUsers:     number;
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4 },
  }),
};

export function AdminOverview({ stats }: AdminOverviewProps) {
  const STAT_CARDS = [
    {
      title:    "Total users",
      value:    stats.totalUsers.toLocaleString(),
      icon:     Users,
      iconColor: "text-blue-500",
      iconBg:   "bg-blue-50",
      subtitle: `${stats.totalWorkers} workers · ${stats.totalHirers} hirers`,
    },
    {
      title:    "Total revenue",
      value:    `LKR ${stats.totalRevenue.toLocaleString()}`,
      icon:     TrendingUp,
      iconColor: "text-green-500",
      iconBg:   "bg-green-50",
      subtitle: `${stats.totalPayments} completed payments`,
    },
    {
      title:    "Active chats",
      value:    stats.totalChats.toLocaleString(),
      icon:     MessageCircle,
      iconColor: "text-primary",
      iconBg:   "bg-primary/10",
      subtitle: "Chat rooms unlocked",
    },
    {
      title:    "Total reviews",
      value:    stats.totalReviews.toLocaleString(),
      icon:     Star,
      iconColor: "text-amber-500",
      iconBg:   "bg-amber-50",
      subtitle: "Worker reviews submitted",
    },
    {
      title:    "Pending payments",
      value:    stats.pendingPayments.toLocaleString(),
      icon:     Clock,
      iconColor: "text-orange-500",
      iconBg:   "bg-orange-50",
      subtitle: "Awaiting verification",
    },
    {
      title:    "Banned users",
      value:    stats.bannedUsers.toLocaleString(),
      icon:     ShieldOff,
      iconColor: "text-destructive",
      iconBg:   "bg-destructive/10",
      subtitle: "Suspended accounts",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-1">
          Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide stats at a glance.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.title}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              iconColor={card.iconColor}
              iconBg={card.iconBg}
              subtitle={card.subtitle}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}