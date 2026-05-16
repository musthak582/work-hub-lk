"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const POPULAR_SEARCHES = [
  "Electrician", "Plumber", "AC Repair", "Carpenter", "Painter", "Tutor",
];

const DISTRICTS = [
  "Colombo", "Gampaha", "Kandy", "Galle", "Matara",
  "Kurunegala", "Ratnapura", "Negombo",
];

const FLOATING_CARDS = [
  { icon: "⚡", label: "Electrician", sub: "Same day service", top: "18%", left: "6%"  },
  { icon: "🔧", label: "Plumber",     sub: "24/7 available",   top: "55%", left: "2%"  },
  { icon: "🎨", label: "Painter",     sub: "Free quote",        top: "20%", right: "6%" },
  { icon: "❄️", label: "AC Repair",   sub: "Certified tech",    top: "58%", right: "3%" },
];

export function HeroSection() {
  const [query,    setQuery]    = useState("");
  const [district, setDistrict] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query)    params.set("q", query);
    if (district) params.set("district", district);
    router.push(`/workers?${params.toString()}`);
  }

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Floating worker cards — desktop only */}
      {FLOATING_CARDS.map((card, i) => (
        <motion.div
          key={card.label}
          className="absolute hidden xl:flex items-center gap-3 bg-card border border-border/60 rounded-2xl px-4 py-3 shadow-soft-md"
          style={{ top: card.top, left: card.left, right: card.right }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
        >
          <span className="text-2xl">{card.icon}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{card.label}</p>
            <p className="text-xs text-muted-foreground">{card.sub}</p>
          </div>
        </motion.div>
      ))}

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Sri Lanka's #1 Skilled Worker Marketplace
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-foreground leading-[1.05] tracking-tight mb-6"
        >
          Find trusted{" "}
          <span className="gradient-text">skilled workers</span>
          <br />
          near you
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Connect with verified electricians, plumbers, carpenters, tutors
          and more — across all districts in Sri Lanka.
        </motion.p>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-card border border-border/60 rounded-2xl p-2 shadow-soft-lg"
          >
            {/* Search input */}
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Electrician, plumber, tutor…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2"
              />
            </div>

            {/* District selector */}
            <div className="flex items-center gap-2 px-3 border-t sm:border-t-0 sm:border-l border-border/40 pt-3 sm:pt-0">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-transparent text-sm text-foreground outline-none py-2 pr-2 min-w-[120px] cursor-pointer"
              >
                <option value="">All districts</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <Button type="submit" size="lg" className="rounded-xl px-6 shadow-soft">
              Search
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </motion.div>

        {/* Popular searches */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-2 mt-6"
        >
          <span className="text-xs text-muted-foreground">Popular:</span>
          {POPULAR_SEARCHES.map((term) => (
            <button
              key={term}
              onClick={() => {
                setQuery(term);
                router.push(`/workers?q=${term}`);
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-secondary border border-border/40 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent transition-all duration-150"
            >
              {term}
            </button>
          ))}
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground"
        >
          {[
            { icon: "✓", text: "Phone verified workers" },
            { icon: "✓", text: "Secure payments" },
            { icon: "✓", text: "Real reviews only" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-1.5">
              <span className="text-primary font-bold">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}