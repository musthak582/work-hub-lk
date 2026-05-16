"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageCircle, Search, CreditCard,
  ArrowRight, Clock, User,
} from "lucide-react";
import { Button }    from "@/components/ui/button";
import { StatCard }  from "@/components/dashboard/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge }     from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { AuthUser } from "@/types/actions";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

interface HirerDashboardProps {
  user:           AuthUser;
  recentChats:    any[];
  totalChats:     number;
  recentPayments: any[];
}

export function HirerDashboard({
  user, recentChats, totalChats, recentPayments,
}: HirerDashboardProps) {
  const totalSpent = recentPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        custom={0} variants={fadeUp} initial="hidden" animate="show"
        className="flex items-start justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-1">
            Welcome, {user.full_name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Find and connect with skilled workers across Sri Lanka.
          </p>
        </div>
        <Button asChild>
          <Link href="/workers">
            <Search className="w-4 h-4 mr-2" />
            Find workers
          </Link>
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        custom={1} variants={fadeUp} initial="hidden" animate="show"
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <StatCard
          title="Active chats"
          value={totalChats}
          icon={MessageCircle}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
          subtitle="Workers contacted"
        />
        <StatCard
          title="Total spent"
          value={`LKR ${totalSpent.toLocaleString()}`}
          icon={CreditCard}
          iconColor="text-green-500"
          iconBg="bg-green-50"
          subtitle="On chat unlocks"
        />
        <StatCard
          title="Workers hired"
          value={recentPayments.length}
          icon={User}
          iconColor="text-primary"
          iconBg="bg-primary/10"
          subtitle="Via WorkHub LK"
        />
      </motion.div>

      {/* Recent chats */}
      <motion.div
        custom={2} variants={fadeUp} initial="hidden" animate="show"
        className="bg-card border border-border/60 rounded-xl shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Recent chats</h2>
          <Link
            href="/dashboard/chats"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentChats.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No chats yet. Find a worker to get started.
            </p>
            <Button size="sm" asChild>
              <Link href="/workers">
                <Search className="w-4 h-4 mr-1.5" />
                Browse workers
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentChats.map((chat: any) => {
              const worker  = chat.worker;
              const wp      = chat.worker_profile;
              const initials = worker?.full_name
                ?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const timeAgo = formatDistanceToNow(
                new Date(chat.created_at), { addSuffix: true }
              );

              return (
                <Link
                  key={chat.id}
                  href={`/dashboard/chats/${chat.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent transition-colors group"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={wp?.profile_image_url ?? worker?.avatar_url ?? ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {worker?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {wp?.title ?? (wp?.category as any)?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {timeAgo}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Payment history */}
      {recentPayments.length > 0 && (
        <motion.div
          custom={3} variants={fadeUp} initial="hidden" animate="show"
          className="bg-card border border-border/60 rounded-xl shadow-card p-6"
        >
          <h2 className="text-base font-semibold text-foreground mb-5">
            Recent payments
          </h2>
          <div className="space-y-3">
            {recentPayments.map((payment: any) => (
              <div
                key={payment.id}
                className="flex items-center justify-between py-2 border-b border-border/40 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {payment.payment_type.replace("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    LKR {Number(payment.amount).toLocaleString()}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.div
        custom={4} variants={fadeUp} initial="hidden" animate="show"
        className="bg-foreground text-background rounded-2xl p-7 flex items-center justify-between gap-6 flex-wrap"
      >
        <div>
          <h3 className="text-lg font-display font-bold mb-1">
            Find your next skilled worker
          </h3>
          <p className="text-sm text-background/60">
            Browse 2,400+ verified professionals across Sri Lanka.
          </p>
        </div>
        <Button
          asChild
          className="bg-primary hover:bg-primary/90 text-white flex-shrink-0"
        >
          <Link href="/workers">
            <Search className="w-4 h-4 mr-2" />
            Browse workers
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}