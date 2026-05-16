"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, Search, Check, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { selectRoleAction } from "@/actions/auth";

type Role = "worker" | "hirer";

const ROLES = [
  {
    id:    "hirer" as Role,
    icon:  Search,
    title: "I want to hire",
    desc:  "Find and contact verified skilled workers across Sri Lanka.",
    perks: ["Browse all workers free", "Filter by skill & district", "Pay only to unlock chat"],
    color: "blue",
  },
  {
    id:    "worker" as Role,
    icon:  Briefcase,
    title: "I want to work",
    desc:  "Create a professional profile and get hired by clients.",
    perks: ["One-time LKR 1,000 setup fee", "Appear in search results", "Receive direct client enquiries"],
    color: "green",
  },
];

export default function SelectRolePage() {
  const [selected,  setSelected]  = useState<Role | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleContinue() {
    if (!selected) { toast.error("Please select a role to continue"); return; }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("role", selected);

      const result = await selectRoleAction(fd);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "Role selected!");
      router.push(selected === "worker" ? "/payment/worker" : "/dashboard");
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
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

      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          How will you use WorkHub?
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose your role — you can't change this later
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {ROLES.map((role) => {
          const Icon     = role.icon;
          const isActive = selected === role.id;

          return (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                isActive
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border bg-card hover:border-border/80 hover:shadow-soft"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isActive ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{role.title}</h3>
                    {isActive && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{role.desc}</p>
                  <ul className="space-y-1">
                    {role.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? "bg-primary" : "bg-muted-foreground/40"}`} />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleContinue}
        className="w-full"
        size="lg"
        disabled={!selected || isPending}
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up…</>
        ) : (
          `Continue as ${selected === "worker" ? "Worker" : selected === "hirer" ? "Hirer" : "…"}`
        )}
      </Button>
    </motion.div>
  );
}