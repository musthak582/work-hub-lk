"use client";

import { motion } from "framer-motion";

const STATS = [
  { value: "2,400+", label: "Verified workers"   },
  { value: "18,000+", label: "Jobs completed"    },
  { value: "25",      label: "Districts covered" },
  { value: "4.8★",    label: "Average rating"    },
];

export function StatsSection() {
  return (
    <section className="py-16 border-y border-border/40 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}