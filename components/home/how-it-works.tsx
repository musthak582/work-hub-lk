"use client";

import { motion } from "framer-motion";
import { UserPlus, Search, MessageCircle, Star } from "lucide-react";

const HIRER_STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create your account",
    desc: "Sign up free and verify your phone number via OTP.",
  },
  {
    icon: Search,
    step: "02",
    title: "Search & filter",
    desc: "Browse workers by skill, district, rating, and price.",
  },
  {
    icon: MessageCircle,
    step: "03",
    title: "Unlock & chat",
    desc: "Pay LKR 1,000 to unlock direct chat with your chosen worker.",
  },
  {
    icon: Star,
    step: "04",
    title: "Leave a review",
    desc: "Rate and review after the job to help the community.",
  },
];

const WORKER_STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Register & verify",
    desc: "Create your account and verify your phone number.",
  },
  {
    icon: Star,
    step: "02",
    title: "Pay & go live",
    desc: "Pay a one-time LKR 1,000 fee to create your profile.",
  },
  {
    icon: Search,
    step: "03",
    title: "Get discovered",
    desc: "Appear in search results and get hired by clients.",
  },
  {
    icon: MessageCircle,
    step: "04",
    title: "Chat & earn",
    desc: "Communicate with hirers and grow your business.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-secondary/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Simple process
          </p>
          <h2 className="text-4xl font-display font-bold text-foreground mb-4">
            How WorkHub LK works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Getting started takes less than 5 minutes — whether you're
            looking for work or looking to hire.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* For Hirers */}
          <StepsCard
            title="For hirers"
            badge="Find workers"
            badgeColor="bg-blue-50 text-blue-700 border-blue-100"
            steps={HIRER_STEPS}
            delay={0}
          />

          {/* For Workers */}
          <StepsCard
            title="For workers"
            badge="Get hired"
            badgeColor="bg-green-50 text-green-700 border-green-100"
            steps={WORKER_STEPS}
            delay={0.15}
          />
        </div>
      </div>
    </section>
  );
}

function StepsCard({
  title, badge, badgeColor, steps, delay,
}: {
  title: string;
  badge: string;
  badgeColor: string;
  steps: typeof HIRER_STEPS;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="bg-card border border-border/60 rounded-3xl p-8 shadow-soft"
    >
      <div className="flex items-center gap-3 mb-8">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeColor}`}>
          {badge}
        </span>
        <h3 className="text-xl font-display font-bold text-foreground">{title}</h3>
      </div>

      <div className="space-y-6">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.step} className="flex gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-6 bg-border" />
                )}
              </div>
              <div className="pt-1.5 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-muted-foreground/60">
                    {step.step}
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}