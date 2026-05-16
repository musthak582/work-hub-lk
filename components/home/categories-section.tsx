"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Droplets, Hammer, PaintBucket, Wind, Building2,
  Wrench, Camera, GraduationCap, Sparkles, Leaf, Monitor,
  Flame, Palette, Car,
} from "lucide-react";
import type { Category } from "@/types/database";

// Map slug → Lucide icon component
const ICON_MAP: Record<string, React.ElementType> = {
  electrician:       Zap,
  plumber:           Droplets,
  carpenter:         Hammer,
  painter:           PaintBucket,
  "ac-technician":   Wind,
  mason:             Building2,
  mechanic:          Wrench,
  "cctv-installer":  Camera,
  tutor:             GraduationCap,
  cleaner:           Sparkles,
  gardener:          Leaf,
  "it-support":      Monitor,
  welder:            Flame,
  "interior-designer": Palette,
  driver:            Car,
};

const CATEGORY_COLORS: Record<string, string> = {
  electrician:       "bg-amber-50 text-amber-600 border-amber-100",
  plumber:           "bg-blue-50 text-blue-600 border-blue-100",
  carpenter:         "bg-orange-50 text-orange-600 border-orange-100",
  painter:           "bg-pink-50 text-pink-600 border-pink-100",
  "ac-technician":   "bg-cyan-50 text-cyan-600 border-cyan-100",
  mason:             "bg-stone-50 text-stone-600 border-stone-100",
  mechanic:          "bg-zinc-50 text-zinc-600 border-zinc-100",
  "cctv-installer":  "bg-indigo-50 text-indigo-600 border-indigo-100",
  tutor:             "bg-green-50 text-green-600 border-green-100",
  cleaner:           "bg-teal-50 text-teal-600 border-teal-100",
  gardener:          "bg-lime-50 text-lime-600 border-lime-100",
  "it-support":      "bg-violet-50 text-violet-600 border-violet-100",
  welder:            "bg-red-50 text-red-600 border-red-100",
  "interior-designer": "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
  driver:            "bg-sky-50 text-sky-600 border-sky-100",
};

interface CategoriesSectionProps {
  categories: Pick<Category, "id" | "name" | "slug" | "icon" | "description">[];
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <section id="categories" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Browse by service
          </p>
          <h2 className="text-4xl font-display font-bold text-foreground mb-4">
            Every trade, one platform
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From quick repairs to major renovations — find the right skilled
            professional for any job across Sri Lanka.
          </p>
        </div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {categories.map((cat) => {
            const Icon  = ICON_MAP[cat.slug] ?? Zap;
            const color = CATEGORY_COLORS[cat.slug] ?? "bg-primary/5 text-primary border-primary/10";

            return (
              <motion.div key={cat.id} variants={item}>
                <Link
                  href={`/workers?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border/50 bg-card hover:border-border hover:shadow-soft-md transition-all duration-200 text-center"
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight line-clamp-2">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View all */}
        <div className="text-center mt-10">
          <Link
            href="/workers"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all workers
            <span className="text-lg leading-none">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}